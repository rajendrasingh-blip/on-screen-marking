"use client";

import { useEffect, useState } from "react";

import { getAllExamApi, uploadStudentPdf } from "@/api/apiCall";
import { examStore } from "@/store/examStore";

export default function StudentPdfUpload() {
  const [studentId, setStudentId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  const exam = examStore((state) => state.exam);
  const [studentName, setStudentName] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    getAllExamApi();
  }, [])

  async function handleUpload() {
    if (!studentId.trim()) {
      setMessage(
        "Student ID is required"
      );
      return;
    }

    if (!file) {
      setMessage(
        "Please select PDF"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result =
        await uploadStudentPdf(
          file,
          studentId,
          studentName,
          selectedExamId
        );
      setMessage(
        `Uploaded successfully. PDF ID: ${result.pdfId}`
      );

      setFile(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const handleOnchangeExam = (e: any) => {
    console.log(e.target.value, 'e.target.value')
    setSelectedExamId(e.target.value)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 p-6">

      <h2 className="text-xl font-semibold text-zinc-400">
        Student Answer Sheet
      </h2>

      <div className="mt-6 space-y-5">

        <div>
          <label className="text-sm text-zinc-400">
            Student ID
          </label>

          <input
            value={studentId}
            onChange={(e) =>
              setStudentId(
                e.target.value
              )
            }
            placeholder="STU001"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            Student Name
          </label>

          <input
            value={studentName}
            onChange={(e) =>
              setStudentName(
                e.target.value
              )
            }
            placeholder="Student Name"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            Answer Sheet PDF
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              setFile(
                e.target.files?.[0] ??
                null
              )
            }
            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
          />
        </div>
        <div>
          <select onChange={handleOnchangeExam}>
            <option value="">Select Exam</option>
            {exam?.length > 0 && exam?.map(item => <option key={item?._id} value={item?._id}>{item.name}</option>)}
          </select>
        </div>
        {file && (
          <div className="text-sm text-zinc-400">
            {file.name}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading
            ? "Uploading..."
            : "Upload Answer Sheet"}
        </button>

        {message && (
          <div className="rounded-lg bg-zinc-950 p-4 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}