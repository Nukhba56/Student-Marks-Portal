// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB624IPStZFBA30RYCuopqJX9X2Wchu1Bc",
  authDomain: "student-marks-portal-44347.firebaseapp.com",
  projectId: "student-marks-portal-44347",
  storageBucket: "student-marks-portal-44347.firebasestorage.app",
  messagingSenderId: "29668528293",
  appId: "1:29668528293:web:eb9adcd9d7a351545bfd4c",
  measurementId: "G-KEFLEMKB9B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.querySelector("#loginForm");
const msg = document.querySelector("#message");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const button = document.querySelector("#loginBtn");

if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userEmail = emailInput.value.trim();
    const userPassword = passwordInput.value;

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        userEmail,
        userPassword,
      );

      const q = query(
        collection(db, "user"),
        where("uid", "==", result.user.uid),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await signOut(auth);
        msg.style.color = "blue";
        msg.textContent = "User profile not in firestore";

        return;
      }

      const u = snapshot.docs[0].data();

      if (u.role !== "student" && u.role !== "teacher" && u.role !== "admin") {
        await signOut(auth);
        msg.style.color = "red";
        msg.textContent = "Invalid user role";
        return;
      }

      msg.style.color = "green";
      msg.textContent = "Login successfull of:" + u.role + "portal";
      if (u.role === "student") {
        window.location.href = "./student-portal.html";
      } else if (u.role === "teacher") {
        window.location.href = "./teacher-portal.html";
      } else if (u.role === "admin") {
        window.location.href = "./admin-portal.html";
      }

      console.log("Authenticated UID:", result.user.uid);
      console.log("Firestore role:", u.role);
    } catch (error) {
      console.error(error);
      msg.style.color = "red";
      msg.textContent = "Login failed. Incorrect email and password";
    }
  });
}

function getGrade(marks) {
  if (marks >= 80) {
    return "A";
  } else if (marks >= 70) {
    return "B";
  } else if (marks >= 50) {
    return "C";
  } else {
    return "F";
  }
}

async function loadTeaStds() {
  const container = document.querySelector("#teacherPortal");

  if (!container) {
    console.error("Teacher portal container not found!");
    return;
  }

  container.innerHTML = "<p>Loading students...</p>";

  try {
    const studentQuery = query(
      collection(db, "user"),
      where("role", "==", "student"),
    );

    const [studentsSnapshot, marksSnapshot] = await Promise.all([
      getDocs(studentQuery),
      getDocs(collection(db, "marks")),
    ]);

    const students = studentsSnapshot.docs.map(function (document) {
      return { ...document.data(), documentId: document.id };
    });

    const markList = marksSnapshot.docs.map(function (document) {
      return { ...document.data(), documentId: document.id };
    });

    if (students.length === 0) {
      container.innerHTML = "<p>No students found.</p>";
      return;
    }

    let output = `
      
      <table border="1" cellpadding="8">
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Marks</th>
          <th>Grade</th>
          <th>Update Marks</th>
        </tr>
    `;

    students.forEach(function (student) {
      const record = markList.find(function (mark) {
        return mark.stdUid === student.uid;
      });

      const marks = record ? record.marks : "";
      const grade = record ? record.grade : "—";

      output += `
        <tr>
          <td>${student.username || "—"}</td>
          <td>${student.email || "—"}</td>
          <td>${marks === "" ? "Not entered" : marks}</td>
          <td>${grade}</td>
          <td>
            <input
              type="number"
              id="marks-${student.documentId}"
              min="0"
              max="100"
              value="${marks}"
              placeholder="0–100"
            >
            <button
              class="save-marks"
              data-student-uid="${student.uid}"
              data-student-doc="${student.documentId}"
              data-mark-doc="${record ? record.documentId : ""}"
            >Save</button>
          </td>
        </tr>
      `;
    });

    output += "</table>";
    container.innerHTML = output;

    container.querySelectorAll(".save-marks").forEach(function (button) {
      button.addEventListener("click", async function () {
        const studentUid = button.dataset.studentUid;
        const studentDoc = button.dataset.studentDoc;
        const markDoc = button.dataset.markDoc;
        const input = document.querySelector("#marks-" + studentDoc);

        if (
          input.value.trim() === "" ||
          !Number.isFinite(Number(input.value)) ||
          Number(input.value) < 0 ||
          Number(input.value) > 100
        ) {
          msg.style.color = "red";
          msg.textContent = "Enter marks between 0 and 100";
          return;
        }

        const marks = Number(input.value);

        try {
          if (!auth.currentUser) {
            msg.style.color = "red";
            msg.textContent = "Please log in again.";
            return;
          }

          const teacherUid = auth.currentUser.uid;

          const markData = {
            marks: marks,
            grade: getGrade(marks),
            stdUid: studentUid,
            teacherUid: teacherUid,
          };

          if (markDoc) {
            await updateDoc(doc(db, "marks", markDoc), markData);
          } else {
            await addDoc(collection(db, "marks"), markData);
          }

          msg.style.color = "green";
          msg.textContent = "Marks are saved successfully:";
          await loadTeaStds();
        } catch (error) {
          console.error("Saving marks failed:", error);

          msg.style.color = "red";
          msg.textContent = "Marks are not saved ,check console.";
        }
      });
    });
  } catch (error) {
    console.error("Loading students failed:", error);
    container.innerHTML = "<p>Could not load students. Check console.</p>";
  }
}

async function loadLoggedInStdMarks(studentUid, username) {
  const container = document.querySelector("#studentPortal");

  if (!container) {
    console.error("Student portal container not found!");
    return;
  }

  container.innerHTML = "<p>Loading your marks...</p>";

  try {
    const marksQuery = query(
      collection(db, "marks"),
      where("stdUid", "==", studentUid),
    );

    const snapshot = await getDocs(marksQuery);

    if (snapshot.empty) {
      container.innerHTML = `
        <h2>Welcome ${username}</h2>
        <p>Your marks have not been entered yet.</p>
      `;
      return;
    }

    const record = snapshot.docs[0].data();

    container.innerHTML = `
      <h2>Welcome ${username}</h2>
      <h3>Your Result</h3>
      <p>Marks: ${record.marks} / 100</p>
      <p>Grade: ${record.grade}</p>
    `;
  } catch (error) {
    console.error("Student marks loading failed:", error);
    container.innerHTML = "<p>Could not load your marks.</p>";
  }
}

async function loadAdminUsers() {
  const container = document.querySelector("#adminPortal");

  if (!container) return;

  container.innerHTML = "<p>Loading users...</p>";

  try {
    const snapshot = await getDocs(collection(db, "user"));

    if (snapshot.empty) {
      container.innerHTML = "<p>No users found.</p>";
      return;
    }

    let output = `
      
      <table border="1" cellpadding="8">
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Current Role</th>
          <th>Change Role</th>
        </tr>
    `;

    snapshot.docs.forEach(function (userDoc) {
      const user = userDoc.data();

      if (user.role === "admin") {
        return;
      }

      output += `
        <tr>
          <td>${user.username || "—"}</td>
          <td>${user.email || "—"}</td>
          <td>${user.role || "—"}</td>
          <td>
            <select id="role-${userDoc.id}">
              <option value="student" ${user.role === "student" ? "selected" : ""}>Student</option>
              <option value="teacher" ${user.role === "teacher" ? "selected" : ""}>Teacher</option>
      
            </select>
            <button
              class="save-role"
              data-doc-id="${userDoc.id}"
            >Save Role</button>
          </td>
        </tr>
      `;
    });

    output += "</table>";
    container.innerHTML = output;

    container.querySelectorAll(".save-role").forEach(function (button) {
      button.addEventListener("click", async function () {
        const docId = button.dataset.docId;
        const select = document.querySelector("#role-" + docId);
        const newRole = select.value;

        try {
          await updateDoc(doc(db, "user", docId), {
            role: newRole,
          });

          alert("Role updated successfully!");
          await loadAdminUsers();
        } catch (error) {
          console.error("Role update failed:", error);
          alert("Role update nahi hua. Console check karo.");
        }
      });
    });
  } catch (error) {
    console.error("Loading admin users failed:", error);
    container.innerHTML = "<p>Could not load users.</p>";
  }
}

const studentData = document.querySelector("#studentPortal");
const teacherData = document.querySelector("#teacherPortal");
const adminData = document.querySelector("#adminPortal");

if (studentData || teacherData || adminData) {
  onAuthStateChanged(auth, async function (currUser) {
    if (!currUser) {
      window.location.replace("index.html");
      return;
    }
    try {
      const q = query(collection(db, "user"), where("uid", "==", currUser.uid));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await signOut(auth);
        window.location.replace("index.html");
        return;
      }

      const u = snapshot.docs[0].data();

      const expectedRole = studentData
        ? "student"
        : teacherData
          ? "teacher"
          : "admin";

      if (u.role !== expectedRole) {
        const pages = {
          student: "student-portal.html",
          teacher: "teacher-portal.html",
          admin: "admin-portal.html",
        };

        if (pages[u.role]) {
          window.location.replace(pages[u.role]);
        } else {
          await signOut(auth);
          window.location.replace("index.html");
        }

        return;
      }

      const container = studentData || teacherData || adminData;

      if (studentData) {
        await loadLoggedInStdMarks(currUser.uid, u.username || u.email);
      } else if (teacherData) {
        await loadTeaStds();
      } else if (adminData) {
        await loadAdminUsers();
      }
    } catch (error) {
      console.error("Portal loading error:", error);
    }
  });
}
