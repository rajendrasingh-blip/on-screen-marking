import axiosBase from "./axios";
import { examStore, markStore, usersStore } from "@/store/examStore";

interface UploadAnswerSheetData {
  examId: string;
  board: string;
  className: string;
  subject: string;
  stream?: string;
}

type SubQuestionItem = {
  subPart: string;
  title: string;
  maxMarks: number;
};

type QuestionItem = {
  qNo: number;
  title: string;
  maxMarks: number;
  subQuestions: SubQuestionItem[];
};

export async function uploadStudentPdf(
  file: File,
  data: UploadAnswerSheetData
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("examId", data.examId);
  formData.append("board", data.board);
  formData.append("class", data.className);
  formData.append("subject", data.subject);

  if (data.stream) {
    formData.append("stream", data.stream);
  }

  const response = await axiosBase.post(
    "/answer-sheet/upload",
    formData
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Upload failed"
    );
  }

  return response.data.data;
}


// Bulk PDF Upload
export async function uploadBulkStudentPdf(
  files: File[],
  data: UploadAnswerSheetData
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("examId", data.examId);
  formData.append("board", data.board);
  formData.append("class", data.className);
  formData.append("subject", data.subject);

  if (data.stream) {
    formData.append("stream", data.stream);
  }

  const response = await axiosBase.post(
    "/answer-sheet/bulk-upload",
    formData
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Bulk upload failed"
    );
  }

  return response.data.data;
}


export const getAllExamApi = async () => {
  try {
    const res = await axiosBase.get("/exam/all");
    if (res.data.success) {
      examStore.getState().setExam(res?.data.data);
      return res;
    }
  }
  catch (error) {
    console.log(error)
  }
}

export const getCurrentAnswerSheetApi = async (pdfId: string | null) => {
  try {
    const res = await axiosBase.get(`/answer-sheet/${pdfId}`);
    if (res.data.success) {
      return res?.data;
    }
  }
  catch (error) {
    console.log(error)
  }
}


export const saveMarkApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/answer-sheet/mark", param);
    if (res.data.success) {
      getMarksApi({ answerSheetId: param.answerSheetId })
      return res?.data;
    }
  }
  catch (error) {
    console.log(error)
  }
}

export const createExamApi = async (data: any) => {
  try {
    const res = await axiosBase.post(
      "/exam/create",
      data
    );

    if (res.success) {
      return res;
    }

  }
  catch (error) {
    console.log(error)
  }
}

export const createExamQuestionsApi = (data: {
  examId: string;
  subject: string;
  questions: QuestionItem[];
}) => {
  return axiosBase.post("/exam/questions-create", data);
};

export const studentAnswerSheetApi = async () => {
  try {
    const res = await axiosBase.get(
      "/answer-sheet/all"
    );
    if (res.data.success) {
      return res.data;
    }
  }
  catch (error) {
    console.log(error)
  }
}

export const getMarksApi = async (param: any) => {
  try {
    const res = await axiosBase.get("/answer-sheet/allMark", { params: param });
    console.log(res, 'resmark')
    if (res.data.success) {
      markStore.getState().setMarks(res?.data.data)
    }
    return res?.data.data;
  }
  catch (error) {
    console.log(error)
  }
}

export const signupApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/user/signup", param);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}


export const loginApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/user/login", param);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}


export const getCurrentUserApi = async () => {
  try {
    const res = await axiosBase.get("/user/current");
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const logoutApi = async () => {
  try {
    const res = await axiosBase.post("/user/logout");
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const getAllUserApi = async () => {
  try {
    const res = await axiosBase.get("/user/all");
    usersStore.getState().setUsers(res.data.data);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const updateRoleApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/user/updateRole", param);
    getAllUserApi();
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}



