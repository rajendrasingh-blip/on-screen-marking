"use client";

import { useEffect, useState } from "react";

import { getAllExamApi, uploadBulkStudentPdf, uploadStudentPdf } from "@/api/apiCall";
import { examStore } from "@/store/examStore";
import { SUBJECT_CONSTANT } from "../constant/subject";

export default function StudentPdfUpload() {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const exam = examStore((state) => state.exam);
  const [uploadMode, setUploadMode] = useState<"single" | "bulk">("single");
  const [file, setFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAllExamApi();
  }, [])

  const getSubjects = (
    board: string,
    classNo: number,
    stream?: string
  ) => {
    const selectedBoard = SUBJECT_CONSTANT.find(
      (item) => item.board === board
    );

    if (!selectedBoard) return [];

    const selectedClass = selectedBoard.classes.find(
      (item) => item.class === classNo
    );

    if (!selectedClass) return [];

    // Class 11 and 12
    if ("streams" in selectedClass) {
      return (
        selectedClass.streams.find(
          (item) => item.stream === stream
        )?.subjects || []
      );
    }

    // Class 5 to 10
    return selectedClass.subjects;
  };

  // Board list
  const boards = SUBJECT_CONSTANT;

  // Selected board data
  const boardData = boards.find(
    (item) => item.board === selectedBoard
  );

  // Classes
  const classList = boardData?.classes || [];

  // Selected class data
  const classData = classList.find(
    (item) => item.class === Number(selectedClass)
  );

  // Check class 11 or 12
  const hasStream = classData && "streams" in classData;

  // Stream list
  const streamList = hasStream
    ? classData.streams
    : [];

  // Subjects
  const subjectList = selectedClass
    ? getSubjects(
      selectedBoard,
      Number(selectedClass),
      selectedStream || undefined
    )
    : [];

  // Handlers
  const handleExamChange = (e: any) => {
    setSelectedExam(e.target.value);
    setSelectedBoard("");
    setSelectedClass("");
    setSelectedStream("");
    setSelectedSubject("");
  };

  const handleBoardChange = (e: any) => {
    setSelectedBoard(e.target.value);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedSubject("");
  };

  const handleClassChange = (e: any) => {
    setSelectedClass(e.target.value);
    setSelectedStream("");
    setSelectedSubject("");
  };

  const handleStreamChange = (e: any) => {
    setSelectedStream(e.target.value);
    setSelectedSubject("");
  };

  const handleSubjectChange = (e: any) => {
    setSelectedSubject(e.target.value);
  };


  async function handleUpload() {
    try {
      setLoading(true);
      setMessage("");

      if (!selectedExam) {
        setMessage("Please select exam");
        return;
      }

      if (!selectedBoard || !selectedClass || !selectedSubject) {
        setMessage("Please select board, class and subject");
        return;
      }

      if (hasStream && !selectedStream) {
        setMessage("Please select stream");
        return;
      }

      const uploadData = {
        examId: selectedExam,
        board: selectedBoard,
        className: selectedClass,
        subject: selectedSubject,
        stream: selectedStream || undefined,
      };

      if (uploadMode === "single") {
        if (!file) {
          setMessage("Please select PDF");
          return;
        }

        const result = await uploadStudentPdf(
          file,
          uploadData
        );

        setMessage(
          `Uploaded successfully. PDF ID: ${result.pdfId}`
        );

        setFile(null);
      } else {
        if (!bulkFiles.length) {
          setMessage("Please select PDF files");
          return;
        }

        const result = await uploadBulkStudentPdf(
          bulkFiles,
          uploadData
        );

        setMessage(
          `Bulk upload successful. Uploaded: ${result.uploadedCount ?? bulkFiles.length
          } PDFs`
        );

        setBulkFiles([]);
      }

    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-800">
          Student Answer Sheet
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select exam details and upload answer sheet PDF files.
        </p>
      </div>

      <div className="space-y-6">

        {/* Selection Fields - 2 Columns */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Exam */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExam}
              onChange={handleExamChange}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Exam</option>
              {exam?.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Board */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Board <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBoard}
              onChange={handleBoardChange}
              disabled={!selectedExam}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Board</option>
              {boards.map((item) => (
                <option key={item.board} value={item.board}>
                  {item.boardName}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              disabled={!selectedBoard}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Class</option>
              {classList.map((item) => (
                <option key={item.class} value={item.class}>
                  Class {item.class}
                </option>
              ))}
            </select>
          </div>

          {/* Stream */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Stream
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Class 11-12)
              </span>
            </label>
            <select
              value={selectedStream}
              onChange={handleStreamChange}
              disabled={!selectedClass || !hasStream}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {hasStream ? "Select Stream" : "Not Required"}
              </option>
              {streamList.map((item) => (
                <option key={item.stream} value={item.stream}>
                  {item.stream}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              disabled={
                !selectedClass || (hasStream && !selectedStream)
              }
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Subject</option>
              {subjectList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Upload Type */}
        <div className="border-t border-slate-200 pt-5">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Upload Type
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setUploadMode("single");
                setBulkFiles([]);
              }}
              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${uploadMode === "single"
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
            >
              Single PDF
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode("bulk");
                setFile(null);
              }}
              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${uploadMode === "bulk"
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
            >
              Bulk PDFs
            </button>
          </div>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {uploadMode === "single"
              ? "Answer Sheet PDF"
              : "Upload Multiple Answer Sheets"}
          </label>

          <input
            type="file"
            accept="application/pdf"
            multiple={uploadMode === "bulk"}
            onChange={(e) => {
              if (uploadMode === "single") {
                setFile(e.target.files?.[0] ?? null);
              } else {
                setBulkFiles(Array.from(e.target.files || []));
              }
            }}
            className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600 file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-3 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />

          {uploadMode === "single" && file && (
            <p className="mt-2 text-sm text-emerald-600">
              Selected: {file.name}
            </p>
          )}

          {uploadMode === "bulk" && bulkFiles.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Selected PDFs: {bulkFiles.length}
              </p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {bulkFiles.map((pdf, index) => (
                  <div
                    key={`${pdf.name}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-slate-700">
                      {pdf.name}
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {(pdf.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={handleUpload}
            disabled={
              loading ||
              !selectedExam ||
              !selectedBoard ||
              !selectedClass ||
              (hasStream && !selectedStream) ||
              !selectedSubject ||
              (uploadMode === "single"
                ? !file
                : bulkFiles.length === 0)
            }
            className="rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Answer Sheet"}
          </button>

          {message && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}