import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { BookUser, Plus, LogOut, Gauge, AlignJustify } from "lucide-react";
import { toast } from "react-toastify";

const StudentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    class: "",
    section: "",
    rollNumber: "",
    dob: "",
    middleName: "",
    contactNumber: "",
    address: "",
    gender: "",
    email: "",
    admissionDate: "",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    const studentsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStudents(studentsData);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleView = (student) => {
    setViewStudent(student);
    setIsViewModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First Name and Last Name are required.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    if (!formData.class.trim() || !formData.section.trim()) {
      toast.error("Class and Section are required.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    if (!formData.rollNumber.trim()) {
      toast.error("Roll Number is required.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    if (formData.contactNumber.length !== 10 || isNaN(formData.contactNumber)) {
      toast.error("Contact Number must be a valid 10-digit number.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    try {
      // Query the database for a matching record
      const querySnapshot = await getDocs(collection(db, "students"));
      const isDuplicateName = querySnapshot.docs.some(
        (doc) =>
          doc.id !== editStudentId && // Exclude the currently edited student
          doc.data().firstName === formData.firstName &&
          doc.data().lastName === formData.lastName &&
          doc.data().class === formData.class &&
          doc.data().section === formData.section &&
          doc.data().rollNumber === formData.rollNumber
      );
      const isDuplicateRoll = querySnapshot.docs.some(
        (doc) =>
          doc.id !== editStudentId && // Exclude the currently edited student
          doc.data().class === formData.class &&
          doc.data().section === formData.section &&
          doc.data().rollNumber === formData.rollNumber
      );

      if (isDuplicateName || isDuplicateRoll) {
        toast.error(
          "A student with the same First Name, Last Name or same Class, Section, and Roll Number already exists.",
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          }
        );
        return;
      }

      // Add or update the student
      if (isEditing) {
        const studentDoc = doc(db, "students", editStudentId);
        await updateDoc(studentDoc, formData);
        toast.success("Student updated successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setIsEditing(false);
        setEditStudentId(null);
      } else {
        await addDoc(collection(db, "students"), formData);
        toast.success("Student added successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }

      // Refresh the student list and reset the form
      fetchStudents();
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        class: "",
        section: "",
        rollNumber: "",
        dob: "",
        middleName: "",
        contactNumber: "",
        address: "",
        gender: "",
        email: "",
        admissionDate: "",
      });
    } catch (error) {
      console.error("Error adding/updating student: ", error);
      toast.success(
        "An error occurred while saving the data. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
    }
  };

  const handleEdit = (student) => {
    setIsEditing(true);
    setEditStudentId(student.id);
    setFormData(student);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditStudentId(null);
    setFormData({
      firstName: "",
      lastName: "",
      class: "",
      section: "",
      rollNumber: "",
      dob: "",
      middleName: "",
      contactNumber: "",
      address: "",
      gender: "",
      email: "",
      admissionDate: "",
    });
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const studentDoc = doc(db, "students", studentToDelete.id);
      await deleteDoc(studentDoc);
      toast.success("Student deleted successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student: ", error);
      toast.error(
        "An error occurred while deleting the student. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSideBar = async () => {
    setIsSideBarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen">
      <aside className="w-full sm:w-60 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-lg relative">
        <div
          className={`flex justify-between items-center pr-3 border-b border-gray-700`}
        >
          <div className="flex items-center gap-2 p-6 text-center text-2xl font-bold tracking-wide ">
            <Gauge /> Dashboard
          </div>
          <AlignJustify className="md:hidden" onClick={handleSideBar} />
        </div>
        <nav className="hidden md:block flex-grow space-y-2 mt-4 py-2 relative">
          <button
            onClick={() => navigate("/students")}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 cursor-pointer hover:text-white transition-colors duration-300"
          >
            <BookUser /> Students Page
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-left cursor-pointer text-white bg-red-700 hover:bg-red-600 hover:text-white transition-colors duration-300 absolute bottom-0"
          >
            <LogOut /> Logout
          </button>
        </nav>
        {isSideBarOpen && (
          <nav className="flex flex-col space-y-2  pt-2">
            <button
              onClick={() => navigate("/students")}
              className="flex items-center justify-center   gap-2 w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 cursor-pointer hover:text-white transition-colors duration-300"
            >
              <BookUser /> Students Page
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center  gap-2 w-full px-4 py-4 mt-2 text-left cursor-pointer text-white bg-red-700 hover:bg-red-600 hover:text-white transition-colors duration-300"
            >
              <LogOut /> Logout
            </button>
          </nav>
        )}
      </aside>

      <main className="flex-grow px-2 lg:px-8 py-8  bg-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Students List</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            <Plus /> Add Student
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
          <table className="min-w-full text-left border-collapse border border-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className=" px-4 py-2 text-sm font-semibold">ID</th>
                <th className=" px-4 py-2 text-sm font-semibold">Name</th>
                <th className=" px-4 py-2 text-sm font-semibold">Class</th>
                <th className=" px-4 py-2 text-sm font-semibold">Section</th>
                <th className=" px-4 py-2 text-sm font-semibold">
                  Roll Number
                </th>
                <th className=" px-4 py-2 text-sm font-semibold text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className={`hover:bg-gray-200 transition-colors duration-300 ${
                    index % 2 === 0 ? "bg-[#f2f2f2]" : "bg-white"
                  }`}
                >
                  <td className=" px-4 py-4 text-sm text-gray-700">
                    {index + 1}
                  </td>
                  <td className=" px-4 py-4 text-sm text-gray-700">
                    {`${student.firstName} ${student.lastName}`}
                  </td>
                  <td className=" px-4 py-4 text-sm text-gray-700">
                    {student.class}
                  </td>
                  <td className=" px-4 py-4 text-sm text-gray-700">
                    {student.section}
                  </td>
                  <td className=" px-4 py-4 text-sm text-gray-700">
                    {student.rollNumber}
                  </td>
                  <td className=" px-4 py-4 flex gap-2 justify-center">
                    <button
                      onClick={() => handleView(student)}
                      className="cursor-pointer px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors duration-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="cursor-pointer px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(student)}
                      className="cursor-pointer px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors duration-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] lg:w-[60%] h-[95%] sm:h-fit overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Edit Student" : "Add Student"}
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="overflow-y-auto flex flex-col gap-1">
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">
                      Contact Number
                    </label>
                    <input
                      type="number"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Class</label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">
                      Roll Number
                    </label>
                    <input
                      type="number"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-3">
                    <label className="text-sm font-bold mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      className="border px-2 py-1 rounded col-span-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
                    >
                      {isEditing ? "Update" : "Submit"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Student Modal */}
        {isViewModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] lg:w-1/2 max-h-[90%] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 border-gray-200 flex items-center gap-2">
                Student Details{" "}
                <p className="text-slate-500 font-extralight text-[15px]">
                  (ID: {viewStudent.id})
                </p>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  "firstName",
                  "lastName",
                  "middleName",
                  "gender",
                  "contactNumber",
                  "email",
                  "dob",
                  "class",
                  "section",
                  "rollNumber",
                  "admissionDate",
                  "address",
                ].map((key) => (
                  <div key={key} className="border-b border-gray-200 pb-2">
                    <strong className="text-gray-700">
                      {key === "dob"
                        ? "Date of Birth"
                        : key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, " $1")}
                      :
                    </strong>
                    <p className="text-gray-900">
                      {viewStudent?.[key] || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] sm:w-1/3">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-700">
                Are you sure you want to delete
                <strong>
                  {" "}
                  {studentToDelete?.firstName} {studentToDelete?.lastName}
                </strong>
                ?
              </p>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentsPage;
