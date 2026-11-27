"use client"
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import * as pdfjsLib from "pdfjs-dist";
import { studentAnswerSheetApi, getCurrentAnswerSheetApi, saveMarkApi, getMarksApi, logoutApi, getAllExamApi } from "@/api/apiCall";
import { answerSheetStore, examStore, markStore } from "@/store/examStore";
import { ExaminerData, SavedMark, SelectedQuestion } from "@/types/globalTypes";
import { Check, ChevronLeft, ChevronRight, FileText, Loader2, LogOut } from "lucide-react";

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
  const [pageInput, setPageInput] = useState("1");

  const answerId = answerSheetStore((state) => state.answerId);
  const setAnswerId = answerSheetStore((state) => state.setAnswerId);
  const allMarkData = markStore((state) => state.marks);
  const examList = examStore((state) => state.exam)

  // FILTER STATES
  const [filterBoard, setFilterBoard] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Replace allExamData with your actual exam-list variable
  // Expected exam structure: { _id, name }

  // Only processed PDFs
  const readyPdfs = (allPdfData || []).filter(
    (item: any) => item.processingStatus === "ready"
  );

  // Dynamic filter options
  const boardOptions = [...new Set(
    readyPdfs.map((item: any) => item.board).filter(Boolean)
  )];

  const examOptions = examList.filter((exam: any) =>
    readyPdfs.some(
      (pdf: any) =>
        String(pdf.examId) === String(exam._id) &&
        (!filterBoard || pdf.board === filterBoard)
    )
  );

  const classOptions = [...new Set(
    readyPdfs
      .filter((pdf: any) =>
        (!filterBoard || pdf.board === filterBoard) &&
        (!filterExam || String(pdf.examId) === filterExam)
      )
      .map((pdf: any) => pdf.className)
      .filter(Boolean)
  )];

  const subjectOptions = [...new Set(
    readyPdfs
      .filter((pdf: any) =>
        (!filterBoard || pdf.board === filterBoard) &&
        (!filterExam || String(pdf.examId) === filterExam) &&
        (!filterClass || pdf.className === filterClass)
      )
      .map((pdf: any) => pdf.subject)
      .filter(Boolean)
  )];

  const filteredPdfs = readyPdfs.filter((pdf: any) =>
    (!filterBoard || pdf.board === filterBoard) &&
    (!filterExam || String(pdf.examId) === filterExam) &&
    (!filterClass || pdf.className === filterClass) &&
    (!filterSubject || pdf.subject === filterSubject)
  );

  useEffect(() => {
    getAllExamApi();
  }, [])

  useEffect(() => {
    if (answerId) {
      loadExaminerData();
      getAllMarkData();
    }

    fetchAnswerSheetData();

  }, [answerId]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = () => {
    const page = Number(pageInput);
    const totalPages = data?.answerSheet.totalPages || 1;

    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      alert(`Please enter page number between 1 and ${totalPages}`);
      return;
    }

    setCurrentPage(page);
  };

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
        const pdfData = await getCurrentAnswerSheetApi(answerId);
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
        `${process.env.NEXT_PUBLIC_API_URL}/answer-sheet/${answerId}/pdf`;

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

  const handleLogout = async () => {
    try {
      const response = await logoutApi();

      if (!response.success) {
        throw new Error("Logout failed");
      }

      window.location.replace("/");

    } catch (error) {
      console.error(error);
    }
  };

  /* ==================================================
     UI
  ================================================== */


  const examDropdownOptions = examList.length
    ? examOptions
    : [...new Map(
      readyPdfs
        .filter((pdf: any) =>
          !filterBoard || pdf.board === filterBoard
        )
        .map((pdf: any) => [
          String(pdf.examId),
          { _id: String(pdf.examId), name: `Exam ${String(pdf.examId).slice(-5)}` }
        ])
    ).values()];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-100">

      {/* ================= HEADER ================= */}
      <header className="h-[68px] shrink-0 bg-slate-900 text-white px-6 flex items-center justify-between shadow-md">

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileText size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-wide">
              On-Screen Marking
            </h1>
            <p className="text-xs text-slate-400">
              Examiner Evaluation Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">

          <div className="text-right">
            <p className="text-sm font-semibold">
              {data?.exam?.name || "Select Examination"}
            </p>
            <p className="text-xs text-slate-400">
              {data?.exam?.subject || "Subject not selected"}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-700" />
        </div>
      </header>


      {/* ================= FILTER SECTION ================= */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-4 shadow-sm">
        <div className="grid grid-cols-5 gap-3">
          {/* EXAM */}
          <div>
            <select
              value={filterExam}
              onChange={(e) => {
                setFilterExam(e.target.value);
                setFilterClass("");
                setFilterSubject("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Examinations</option>

              {examDropdownOptions.map((exam: any) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>


          {/* CLASS */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSubject("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Classes</option>

              {classOptions.map((cls: any) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>


          {/* SUBJECT */}
          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Subjects</option>

              {subjectOptions.map((subject: any) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>


          {/* ANSWER SHEET */}
          <div>
            <select
              onChange={onChangeAnswerSheet}
              defaultValue=""
              className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-800 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select PDF</option>

              {filteredPdfs.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.originalFileName}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>


      {/* ================= MAIN WORKSPACE ================= */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">

        {/* ================= LEFT 30% ================= */}
        <div className="w-[30%] shrink-0 min-w-0 flex flex-col bg-white border-r border-slate-200">

          {/* LEFT HEADER */}
          <div className="px-4 py-4 border-b bg-slate-50">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-slate-800 text-base">
                  Question Marking
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Enter marks for each question
                </p>
              </div>

              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                {data?.exam?.questions?.length || 0} Questions
              </span>

            </div>

          </div>


          {/* QUESTION BOXES */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">

            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))"
              }}
            >

              {data?.exam?.questions?.map((q: any, idx: number) => {

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
                          <Check size={13} />
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}

                    </div>


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
                      className={`w-full text-center rounded-lg border bg-white py-2.5 text-lg font-bold outline-none transition-all ${isCompleted
                        ? "border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        : "border-orange-200 text-orange-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        }`}
                      placeholder="0"
                    />


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

          <div className="h-16 shrink-0 border-t border-gray-200 bg-white px-4 flex items-center justify-center gap-2">
            <button
              onClick={handleLogout}
              className="mr-auto flex cursor-pointer shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 active:scale-95"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>


        {/* ================= RIGHT 70% PDF SECTION ================= */}
        <div className="w-[70%] min-w-0 flex flex-col bg-slate-200">
          {/* PDF CANVAS AREA */}
          <div className="flex-1 min-h-0 overflow-auto p-5 flex justify-center items-start">

            <div
              ref={pageContainerRef}
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
                .filter((mark) => mark.pageNumber === currentPage)
                .map((mark) => {

                  if (!currentPageData) return null;

                  const canvas = canvasRef.current;

                  if (!canvas) return null;

                  const rect = canvas.getBoundingClientRect();

                  const left =
                    (mark.x / currentPageData.width) * rect.width;

                  const top =
                    (mark.y / currentPageData.height) * rect.height;

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
                      {mark.awardedMarks}/{mark.maxMarks}
                    </div>
                  );
                })}

            </div>

          </div>


          {/* ================= PDF PAGINATION ================= */}
          <div className="h-16 shrink-0 border-t border-slate-200 bg-white px-4 flex items-center justify-center gap-3">

            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition"
            >
              <ChevronLeft size={16} />
              Previous
            </button>


            <div className="flex items-center gap-1 overflow-x-auto max-w-[60%]">

              {Array.from(
                { length: data?.answerSheet?.totalPages || 1 },
                (_, i) => i + 1
              )
                .filter(
                  (page) =>
                    page >= currentPage - 2 &&
                    page <= currentPage + 2
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-9 h-9 rounded-lg border text-sm font-semibold transition ${currentPage === page
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}

            </div>


            <button
              disabled={
                currentPage >= (data?.answerSheet?.totalPages || 1)
              }
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Next
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      </div>


      {/* ================= MARK POPUP ================= */}
      {selectedQuestion && (
        <div
          style={{
            position: "fixed",
            left: selectedQuestion.screenX,
            top: selectedQuestion.screenY,
            transform: "translateY(5px)",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            boxShadow: "0 5px 25px rgba(0,0,0,.25)",
            padding: 15,
            zIndex: 1000,
            minWidth: 230,
          }}
        >

          <div className="font-bold text-base mb-2">
            Question {selectedQuestion.qNo}

            {selectedQuestion.subPart !== "main" &&
              ` (${selectedQuestion.subPart})`}
          </div>

          <div className="text-sm text-slate-600 mb-3">
            Maximum Marks:{" "}
            <strong>{selectedQuestion.maxMarks}</strong>
          </div>

          <div className="flex flex-wrap gap-2">

            {Array.from(
              { length: selectedQuestion.maxMarks + 1 },
              (_, mark) => (
                <button
                  key={mark}
                  disabled={saving}
                  onClick={() => saveMark(mark)}
                  className="min-w-9 h-9 rounded-md border border-slate-300 text-sm font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 transition"
                >
                  {mark}
                </button>
              )
            )}

          </div>

          <button
            onClick={() => setSelectedQuestion(null)}
            className="w-full mt-3 rounded-lg border border-slate-300 py-2 text-sm hover:bg-slate-100"
          >
            Cancel
          </button>

        </div>
      )}


      {/* ================= LOADING ================= */}
      {rendering && (
        <div className="fixed right-5 top-20 bg-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-slate-700 z-50 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          Loading PDF page...
        </div>
      )}

    </div>
  );
}