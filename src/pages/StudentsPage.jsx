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

const StudentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    class: "",
    section: "",
    rollNumber: "",
    dob: "",
    parentName: "",
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
      alert("First Name and Last Name are required.");
      return;
    }
    if (!formData.class.trim() || !formData.section.trim()) {
      alert("Class and Section are required.");
      return;
    }
    if (!formData.rollNumber.trim()) {
      alert("Roll Number is required.");
      return;
    }
    if (formData.contactNumber.length !== 10 || isNaN(formData.contactNumber)) {
      alert("Contact Number must be a valid 10-digit number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
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
        alert(
          "A student with the same First Name, Last Name or same Class, Section, and Roll Number already exists."
        );
        return;
      }

      // Add or update the student
      if (isEditing) {
        const studentDoc = doc(db, "students", editStudentId);
        await updateDoc(studentDoc, formData);
        alert("Student updated successfully!");
        setIsEditing(false);
        setEditStudentId(null);
      } else {
        await addDoc(collection(db, "students"), formData);
        alert("Student added successfully!");
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
        parentName: "",
        contactNumber: "",
        address: "",
        gender: "",
        email: "",
        admissionDate: "",
      });
    } catch (error) {
      console.error("Error adding/updating student: ", error);
      alert("An error occurred while saving the data. Please try again.");
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
      parentName: "",
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
      alert("Student deleted successfully!");
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student: ", error);
      alert("An error occurred while deleting the student. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen">
      <aside className="w-full sm:w-60 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-lg">
        <div className="p-6 text-center text-2xl font-bold tracking-wide border-b border-gray-700">
          Dashboard
        </div>
        <nav className="flex-grow space-y-2 mt-4">
          <button
            onClick={() => navigate("/students")}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300"
          >
            Students Page
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300"
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-grow p-8 bg-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Students List</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            Add Student
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
                <th className=" px-4 py-2 text-sm font-semibold">Action</th>
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
                      className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors duration-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(student)}
                      className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors duration-300"
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
                      name="parentName"
                      value={formData.parentName}
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
                      <option value="">Select</option>
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
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center "
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] lg:w-1/2 h-[90%] lg:h-fit overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Student Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(viewStudent || {}).map(([key, value]) => (
                  <div key={key}>
                    <strong>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </strong>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
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
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
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
