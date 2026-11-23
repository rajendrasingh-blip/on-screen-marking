import StudentPdfUpload from "@/components/StudentPdfUpload";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-800">

      <div className=" ">

        <h1 className="text-3xl font-bold">
          Student Answer Sheet Upload
        </h1>

        <p className="mt-2 text-zinc-400">
          Uploading the PDF automatically
          starts background processing.
        </p>

        <div className="mt-8">
          <StudentPdfUpload

          />
        </div>

      </div>
    </main>
  );
}