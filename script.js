const users = [
  {
    id: 1,
    username: "student1",
    password: "001S",
    role: "student",
    marks: 85,
  },
  {
    id: 2,
    username: "teacher1",
    password: "002T",
    role: "teacher",
  },
  {
    id: 3,
    username: "admin1",
    password: "003A",
    role: "admin",
  },
  {
    id: 4,
    username: "student2",
    password: "004S",
    role: "student",
    marks: 72,
  },
  {
    id: 5,
    username: "student3",
    password: "005S",
    role: "student",
    marks: 46,
  },
];

function getStd() {
  return users.filter(function (user) {
    return user.role === "student";
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

const form = document.querySelector("#loginForm");
const msg = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const passwordInput = document.querySelector("#password");
const button = document.querySelector("#loginBtn");

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = nameInput.value;
    const userPassword = passwordInput.value;

    const loggedInUser = users.find(function (user) {
      return user.username === username && user.password === userPassword;
    });

    if (!loggedInUser) {
      msg.textContent = "Invalid username or password";
    } else {
      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          id: loggedInUser.id,
          username: loggedInUser.username,
        }),
      );
      msg.textContent = "Login successful!";
      console.log(loggedInUser.role);
      if (loggedInUser.role === "student") {
        window.location.href = "student-portal.html";
      } else if (loggedInUser.role === "teacher") {
        window.location.href = "teacher-portal.html";
      } else {
        window.location.href = "admin-portal.html";
      }
    }

    console.log("Form Submitted!");
  });
}

// button.addEventListener("click", function () {
//   console.log("Button clicked!")
// });

function showStudentPortal(user) {
  const stdData = document.querySelector("#studentPortal");

  stdData.innerHTML = `
     <h2>Welcome ${user.username}</h2>
    <p>Marks: ${user.marks}</p>
    <p>Grade: ${getGrade(user.marks)}</p>
    `;
}
function showTeacherPortal() {
  const teaData = document.querySelector("#teacherPortal");
  const students = getStd();

  students.sort(function (a, b) {
    return b.marks - a.marks;
  });
  let output = `
    <table border="1" cellpadding="8">
      <tr>
        <th>Name</th>
        <th>Marks</th>
        <th>Grade</th>
        <th>Rank</th>
        <th>Update</th>
      </tr>
    `;
  students.forEach(function (s, idx) {
    output += `
        <tr>
        <td>${s.username}</td>
        <td>${s.marks}</td>
        <td>${getGrade(s.marks)}</td>
        <td>${idx + 1}</td>
        <td>
          <input type="number" id="marks${s.id}"
            min="0" max="100">
          <button onclick="updateMarks(${s.id})">
            Save
          </button>
        </td>
      </tr> 
        `;
  });
  output += "</table>";
  teaData.innerHTML = output;
}

function updateMarks(id) {
  const input = document.querySelector("#marks" + id);
  const marks = Number(input.value);

  if (input.value === "" || marks < 0 || marks > 100) {
    alert("Enter marks between 0 to 100");
    return;
  }

  const std = users.find(function (u) {
    return u.id === id && u.role === "student";
  });
  if (std) {
    std.marks = marks;
    showTeacherPortal();
  }
}
function showAdminPortal() {
  const adminData = document.querySelector("#adminPortal");
  let output = ``;
  users.forEach(function (u) {
    if (u.role !== "admin") {
      output += `
                <p>
          ${u.username} - ${u.role}
          <select id="role${u.id}">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
      
          </select>
                <button onclick="changeRole(${u.id})">Save</button>

        </p>
            `;
    }
  });

  adminData.innerHTML = output;
  users.forEach(function (u) {
    if (u.role !== "admin") {
      document.querySelector("#role" + u.id).value = u.role;
    }
  });
}

function changeRole(id) {
  const select = document.querySelector("#role" + id);

  const user = users.find(function (item) {
    return item.id === id && item.role !== "admin";
  });

  if (user) {
    user.role = select.value;

    if (user.role === "student" && user.marks === undefined) {
      user.marks = 0;
    }

    if (user.role === "teacher") {
      delete user.marks;
    }

    showAdminPortal();
  }
}

const studentData = document.querySelector("#studentPortal");
const teacherData = document.querySelector("#teacherPortal");
const adminData = document.querySelector("#adminPortal");

if (studentData || teacherData || adminData) {
  const savedUser = sessionStorage.getItem("loggedInUser");

  if (savedUser) {
    const loginUser = JSON.parse(savedUser);

    const user = users.find(function (item) {
      return item.id === loginUser.id;
    });

    if (user && studentData && user.role === "student") {
      showStudentPortal(user);
    } else if (user && teacherData && user.role === "teacher") {
      showTeacherPortal();
    } else if (user && adminData && user.role === "admin") {
      showAdminPortal();
    } else {
      window.location.href = "index.html";
    }
  } else {
    window.location.href = "index.html";
  }
}
