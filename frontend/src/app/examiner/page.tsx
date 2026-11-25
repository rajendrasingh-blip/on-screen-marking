"use client"
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import * as pdfjsLib from "pdfjs-dist";
import { studentAnswerSheetApi, getCurrentAnswerSheetPdfApi, saveMarkApi, getMarksApi } from "@/api/apiCall";
import { answerSheetStore, markStore } from "@/store/examStore";
import { ExaminerData, SavedMark, SelectedQuestion } from "@/types/globalTypes";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export default function ExaminerAnswerSheet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [data, setData] = useState<ExaminerData | null>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [allPdfData, setAllPdfData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftMarks, setDraftMarks] = useState<Record<string, string>>({});

  const answerId = answerSheetStore((state) => state.answerId);
  const setAnswerId = answerSheetStore((state) => state.setAnswerId);
  const allMarkData = markStore((state) => state.marks);

  useEffect(() => {
    if (answerId) {
      loadExaminerData();
      getAllMarkData();
    }

    fetchAnswerSheetData();

  }, [answerId]);

  const getAllMarkData = () => {
    getMarksApi({ answerSheetId: answerId })
  }
  const fetchAnswerSheetData = async () => {
    const res = await studentAnswerSheetApi();
    if (res.data.length > 0) {
      setAllPdfData(res.data);
    }
  }

  const loadExaminerData =
    async () => {
      try {
        setLoading(true);
        const pdfData = await getCurrentAnswerSheetPdfApi(answerId);
        setData(pdfData);
      } catch (error) {
        console.error(
          "Failed to load examiner data",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==================================================
     LOAD PDF
  ================================================== */

  useEffect(() => {
    if (!data) return;

    loadPdf();
  }, [data]);

  const loadPdf = async () => {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdf.worker.mjs";

      const pdfUrl =
        `${process.env.NEXT_PUBLIC_API_URL}/student/answer-sheet/${answerId}/pdf`;

      console.log("PDF URL:", pdfUrl);

      const loadingTask =
        pdfjsLib.getDocument({
          url: pdfUrl,
        });

      const loadedPdf =
        await loadingTask.promise;

      setPdf(loadedPdf);
    } catch (error) {
      console.error(
        "Failed to load PDF",
        error
      );
    }
  };

  /* ==================================================
     RENDER CURRENT PAGE
  ================================================== */

  useEffect(() => {
    if (!pdf) return;

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdf, currentPage]);

  const renderPage = async () => {
    if (!pdf) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    try {
      setRendering(true);

      // Cancel previous render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page =
        await pdf.getPage(currentPage);

      const originalViewport =
        page.getViewport({
          scale: 1,
        });

      const maxWidth =
        Math.min(
          window.innerWidth - 100,
          1000
        );

      const scale =
        maxWidth /
        originalViewport.width;

      const viewport =
        page.getViewport({
          scale,
        });

      canvas.width =
        Math.floor(viewport.width);

      canvas.height =
        Math.floor(viewport.height);

      const context =
        canvas.getContext("2d");

      if (!context) return;

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const renderTask =
        page.render({
          canvasContext: context,
          viewport,
        });

      renderTaskRef.current =
        renderTask;

      await renderTask.promise;

      if (
        renderTaskRef.current ===
        renderTask
      ) {
        renderTaskRef.current = null;
      }

    } catch (error: any) {

      if (
        error?.name !==
        "RenderingCancelledException"
      ) {
        console.error(
          "Page rendering failed",
          error
        );
      }

    } finally {
      setRendering(false);
    }
  };

  /* ==================================================
     RIGHT CLICK
  ================================================== */

  const handleContextMenu = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    event.preventDefault();

    if (!data) {
      return;
    }

    const page =
      data.coordinateMap.pages.find(
        (item) =>
          item.pageNumber === currentPage
      );

    if (!page) {
      return;
    }

    const canvas =
      event.currentTarget;

    const rect =
      canvas.getBoundingClientRect();

    // Display/browser coordinate
    const displayX =
      event.clientX - rect.left;

    const displayY =
      event.clientY - rect.top;

    // Convert display coordinate
    // to coordinate-map coordinate
    const actualX =
      displayX *
      (page.width / rect.width);

    const actualY =
      displayY *
      (page.height / rect.height);

    console.log(
      "================================"
    );

    console.log(
      "Canvas rect:",
      {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    );

    console.log(
      "Display:",
      {
        x: displayX,
        y: displayY,
      }
    );

    console.log(
      "Actual:",
      {
        x: actualX,
        y: actualY,
      }
    );

    console.log(
      "Page coordinate size:",
      {
        width: page.width,
        height: page.height,
      }
    );

    /*
     * Find clicked region
     */
    const region =
      page.regions.find(
        (item) => {
          if (!item.region) {
            return (
              actualY >= item.yTop &&
              actualY <= item.yBottom
            );
          }

          return (
            actualX >= item.region.x1 &&
            actualX <= item.region.x2 &&
            actualY >= item.region.y1 &&
            actualY <= item.region.y2
          );
        }
      );

    if (!region) {
      console.log(
        "No question detected"
      );

      setSelectedQuestion(null);

      return;
    }

    console.log(
      "DETECTED REGION:",
      region
    );

    const qNo =
      String(region.qNo);

    const subPart =
      String(
        region.subPart ?? "main"
      );

    const examQuestion =
      data.exam.questions.find(
        (question) =>
          String(question.qNo)
            .replace(/[()]/g, "")
            .trim() ===
          qNo.replace(/[()]/g, "").trim() &&
          question.title
            .toLowerCase()
            .includes(
              subPart.toLowerCase()
            )
      );

    const maxMarks =
      Number(
        region.maxMarks ??
        examQuestion?.maxMarks ??
        0
      );

    console.log(
      "Detected Question:",
      qNo
    );

    console.log(
      "Detected SubPart:",
      subPart
    );

    console.log(
      "Maximum Marks:",
      maxMarks
    );

    const markX =
      region.region
        ? (region.region.x1 + region.region.x2) / 2
        : actualX;

    const markY =
      region.region
        ? (region.region.y1 + region.region.y2) / 2
        : (region.yTop + region.yBottom) / 2;

    setSelectedQuestion({
      pageNumber:
        currentPage,

      qNo,

      subPart,

      maxMarks,

      x: markX,
      y: markY,

      screenX:
        event.clientX,

      screenY:
        event.clientY,
    });
  };

  /* ==================================================
     SAVE MARK
  ================================================== */

  const saveMark =
    async (
      awardedMarks: number
    ) => {
      if (
        !selectedQuestion
      ) {
        return;
      }

      try {
        setSaving(true);
        const params = {
          answerSheetId:
            answerId,

          pageNumber:
            selectedQuestion.pageNumber,

          qNo:
            selectedQuestion.qNo,

          subPart:
            selectedQuestion.subPart,

          awardedMarks,

          x:
            selectedQuestion.x,

          y:
            selectedQuestion.y,
        }

        await saveMarkApi(params);

        setSelectedQuestion(
          null
        );

      } catch (error) {
        console.error(
          "Failed to save marks",
          error
        );
      } finally {
        setSaving(false);
      }
    };

  const finalSaveMark =
    async (
      awardedMarks: string,
      question: any
    ) => {
      if (
        !question
      ) {
        return;
      }

      try {
        const params = {
          answerSheetId:
            answerId,

          pageNumber:
            question.pageNumber,

          qNo:
            question.qNo,

          subPart:
            question.subPart,

          awardedMarks,

          x:
            question.x,

          y:
            question.y,
        }

        setDraftMarks((prev) => ({
          ...prev,
          [question._id]: awardedMarks
        }))

        await saveMarkApi(params);

      } catch (error) {
        console.error(
          "Failed to save marks",
          error
        );
      }
    };


  /* ==================================================
     LOADING
  ================================================== */

  // if (loading) {
  //   return (
  //     <div
  //       style={{
  //         padding: 30,
  //       }}
  //     >
  //       Loading answer sheet...
  //     </div>
  //   );
  // }


  const currentPageData = data &&
    data.coordinateMap.pages.find(
      (page) =>
        page.pageNumber ===
        currentPage
    );

  const onChangeAnswerSheet = (e: any) => {
    setAnswerId(e.target.value)
  }

  /* ==================================================
     UI
  ================================================== */

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#eee",
        display: "flex",
        flexDirection:
          "column",
      }}
    >

      {/* HEADER */}
      <div
        style={{
          height: 60,
          background: "#fff",
          borderBottom:
            "1px solid #ddd",

          display: "flex",
          alignItems: "center",

          padding:
            "0 20px",

          gap: 25,
        }}
      >
        {data && <>
          <strong>
            {data && data.exam.name}
          </strong>

          <span>
            {data && data.exam.subject}
          </span>

          <span>
            {data && data.answerSheet
              .originalFileName}
          </span>

          <span>
            Page{" "}
            {currentPage} /{" "}
            {
              data && data.answerSheet
                .totalPages
            }
          </span>

        </>}


        <select
          onChange={onChangeAnswerSheet}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select Answer Sheet</option>

          {allPdfData?.map((item: any) => (
            <option key={item._id} value={item._id}>
              {item.originalFileName}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          minHeight: 0,
          overflow: "hidden",
          gap: 0,
        }}
      >
        {/* LEFT SECTION - 30% */}
        <div
          style={{
            flex: "0 0 30%",
            width: "30%",
            minWidth: 0,
            background: "#fff",
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* LEFT HEADER */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-base">
                Question Marking
              </h2>

              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {data?.exam.questions.length || 0} Questions
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Enter marks for each question
            </p>
          </div>

          {/* QUESTION BOXES */}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 14,
            }}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
              }}
            >
              {data?.exam.questions.map((q: any, idx: number) => {
                const key = `${q.qNo}-${q.subPart || ""}-${idx}`;

                const maxMarks = Number(q.maxMarks || 0);

                const savedMark = allMarkData.find((item) => {
                  const sameQuestion =
                    String(item.qNo) === String(q.qNo);

                  if (!sameQuestion) return false;

                  return q.subPart
                    ? String(item.subPart || "") === String(q.subPart)
                    : true;
                });

                const id = savedMark?._id;

                const value =
                  id && draftMarks[id] !== undefined
                    ? draftMarks[id]
                    : savedMark?.awardedMarks !== undefined
                      ? String(savedMark.awardedMarks)
                      : "";

                const isCompleted = id
                  ? draftMarks[id] === value
                  : false;

                return (
                  <div
                    key={key}
                    className={`
            group relative rounded-xl border p-3
            transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-md
            ${isCompleted
                        ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-400"
                        : "border-orange-200 bg-orange-50/70 hover:border-orange-400"
                      }
          `}
                  >
                    {/* STATUS INDICATOR */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">
                        Q {q.qNo}
                        {q.subPart && (
                          <span className="text-gray-500 font-medium">
                            {" "}({q.subPart})
                          </span>
                        )}
                      </span>

                      {isCompleted ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m5 12 4 4L19 6"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </div>

                    {/* MARKS INPUT */}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => {
                        const val = e.target.value;

                        if (val !== "" && !/^\d*\.?\d*$/.test(val)) {
                          return;
                        }

                        if (val !== "" && Number(val) > maxMarks) {
                          return;
                        }

                        finalSaveMark(val, savedMark);
                      }}
                      className={`
              w-full text-center rounded-lg border
              bg-white py-2.5 text-lg font-bold
              outline-none transition-all
              ${isCompleted
                          ? "border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          : "border-orange-200 text-orange-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        }
            `}
                      placeholder="0"
                    />

                    {/* MAX MARKS */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-medium text-gray-500">
                        MAX: {maxMarks}
                      </span>

                      <span
                        className={`text-[10px] font-semibold ${isCompleted
                          ? "text-emerald-600"
                          : "text-orange-600"
                          }`}
                      >
                        {isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
        <div
          style={{
            flex: "0 0 70%",
            width: "70%",
            minWidth: 0,
            overflow: "auto",
            padding: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: "#eee",
          }}
        >
          <div
            ref={
              pageContainerRef
            }
            // onContextMenu={
            //   handleContextMenu
            // }
            style={{
              position: "relative",
              width: canvasRef.current?.getBoundingClientRect().width,
              height: canvasRef.current?.getBoundingClientRect().height,
              display: "inline-block",
              background: "#fff",
              boxShadow: "0 2px 10px rgba(0,0,0,.2)",
              lineHeight: 0,
            }}
          >
            <canvas
              ref={canvasRef}
              onContextMenu={handleContextMenu}
            />

            {/* SAVED MARKS */}

            {allMarkData
              .filter(
                (mark) =>
                  mark.pageNumber ===
                  currentPage
              )
              .map(
                (mark) => {
                  if (
                    !currentPageData
                  ) {
                    return null;
                  }

                  const canvas = canvasRef.current;

                  if (!canvas) return null;

                  const rect = canvas.getBoundingClientRect();

                  const left =
                    (mark.x / currentPageData.width) *
                    rect.width;

                  const top =
                    (mark.y / currentPageData.height) *
                    rect.height;

                  console.log("MARK POSITION", {
                    qNo: mark.qNo,
                    subPart: mark.subPart,

                    original: {
                      x: mark.x,
                      y: mark.y,
                    },

                    page: {
                      width: currentPageData.width,
                      height: currentPageData.height,
                    },

                    rendered: {
                      width: rect.width,
                      height: rect.height,
                    },

                    screen: {
                      left,
                      top,
                    },
                  });

                  return (
                    <div
                      key={`${mark.qNo}-${mark.subPart}`}
                      style={{
                        position: "absolute",

                        left: `${left}px`,
                        top: `${top}px`,

                        transform: "translate(-50%, -50%)",

                        background: "#fff",
                        border: "2px solid red",
                        borderRadius: 5,
                        padding: "10px 28px",

                        fontSize: 14,
                        fontWeight: 700,
                        color: "red",

                        zIndex: 10,
                        pointerEvents: "none",
                      }}
                    >
                      {mark.awardedMarks}/
                      {mark.maxMarks}
                    </div>
                  );
                }
              )}
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <div
        style={{
          height: 60,

          background:
            "#fff",

          borderTop:
            "1px solid #ddd",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          gap: 20,
        }}
      >
        <button
          disabled={
            currentPage <= 1
          }
          onClick={() =>
            setCurrentPage(
              (page) =>
                page - 1
            )
          }
        >
          Previous
        </button>

        <span>
          Page {currentPage}
        </span>

        <button
          disabled={
            currentPage >=
            ((data && data.answerSheet
              .totalPages) ?? 1)
          }
          onClick={() =>
            setCurrentPage(
              (page) =>
                page + 1
            )
          }
        >
          Next
        </button>
      </div>

      {/* MARK POPUP */}

      {
        selectedQuestion && (
          <div
            style={{
              position:
                "fixed",

              left:
                selectedQuestion.screenX,

              top:
                selectedQuestion.screenY,

              transform:
                "translateY(5px)",

              background:
                "#fff",

              border:
                "1px solid #ccc",

              borderRadius:
                8,

              boxShadow:
                "0 5px 25px rgba(0,0,0,.25)",

              padding:
                15,

              zIndex: 1000,

              minWidth: 230,
            }}
          >
            <div
              style={{
                fontWeight: 700,

                fontSize: 16,

                marginBottom: 5,
              }}
            >
              Question{" "}
              {
                selectedQuestion.qNo
              }

              {selectedQuestion.subPart !==
                "main" &&
                ` (${selectedQuestion.subPart})`}
            </div>

            <div
              style={{
                color: "#555",

                marginBottom: 12,
              }}
            >
              Maximum Marks:{" "}
              <strong>
                {
                  selectedQuestion.maxMarks
                }
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap:
                  "wrap",
                gap: 6,
              }}
            >
              {Array.from(
                {
                  length:
                    selectedQuestion.maxMarks +
                    1,
                },
                (_, mark) => (
                  <button
                    key={mark}
                    disabled={saving}
                    onClick={() =>
                      saveMark(
                        mark
                      )
                    }
                    style={{
                      minWidth:
                        35,

                      height:
                        35,

                      cursor:
                        "pointer",
                    }}
                  >
                    {mark}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setSelectedQuestion(
                  null
                )
              }
              style={{
                width: "100%",

                marginTop: 12,
              }}
            >
              Cancel
            </button>
          </div>
        )
      }

      {
        rendering && (
          <div
            style={{
              position:
                "fixed",

              right: 20,

              top: 75,

              background:
                "#fff",

              padding:
                "8px 12px",

              borderRadius: 5,

              boxShadow:
                "0 2px 8px rgba(0,0,0,.15)",
            }}
          >
            Loading page...
          </div>
        )
      }

    </div >
  );
}