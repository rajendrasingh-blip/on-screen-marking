import axiosBase from "./axios";
import { examStore, markStore, usersStore } from "@/store/examStore";

export async function uploadStudentPdf(
  file: File,
  studentId: string,
  studentName: string,
  examId: string
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "studentId",
    studentId
  );
  formData.append(
    "studentName",
    studentName
  );
  formData.append(
    "examId",
    examId
  );

  const response = await axiosBase.post("/student/upload", formData);
  if (response.data.success) {
    const data = response.data.data;
    return data;
  }

}

export const getAllExamApi = async () => {
  try {
    const res = await axiosBase.get("/student/exam");
    if (res.data.success) {
      examStore.getState().setExam(res?.data.data)
    }
  }
  catch (error) {
    console.log(error)
  }
}

export const getCurrentAnswerSheetPdfApi = async (pdfId: string | null) => {
  try {
    const res = await axiosBase.get(`/student/answer-sheet/${pdfId}`);
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
    const res = await axiosBase.post("/student/mark", param);
    if (res.data.success) {
      getMarksApi({ answerSheetId: param.answerSheetId })
      return res?.data;
    }
  }
  catch (error) {
    console.log(error)
  }
}

export const createExamApi = async (form: any) => {
  try {
    await axiosBase.post(
      "/student/create-exam",
      form
    );

  }
  catch (error) {
    console.log(error)
  }
}

export const studentAnswerSheetApi = async () => {
  try {
    const res = await axiosBase.get(
      "/student/answerSheet"
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
    const res = await axiosBase.get("/student/allMark", { params: param });
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
    const res = await axiosBase.post("/auth/signup", param);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}


export const loginApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/auth/login", param);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}


export const getCurrentUserApi = async () => {
  try {
    const res = await axiosBase.get("/auth/currentUser");
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const logoutApi = async () => {
  try {
    const res = await axiosBase.post("/auth/logout");
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const getAllUserApi = async () => {
  try {
    const res = await axiosBase.get("/auth/users");
    usersStore.getState().setUsers(res.data.data);
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}

export const updateRoleApi = async (param: any) => {
  try {
    const res = await axiosBase.post("/auth/updateRole", param);
    getAllUserApi();
    return res.data;
  }
  catch (error) {
    console.log(error);
  }
}



