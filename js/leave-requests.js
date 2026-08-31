// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านจากโฟลเดอร์ leaveRequests บน Firestore ของจริง
//
// 📌 สัปดาห์นี้ทำได้แค่ "อ่าน" เท่านั้น (ตัว R ตัวเดียว)
//    การเพิ่ม แก้ ลบ ลงฐานข้อมูล เป็นงานของสัปดาห์ที่ 7
// ─────────────────────────────────────────────────────────────

import { db, ตั้งค่าครบแล้ว } from "./firebase.js";
import {
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ดึงมาไม่เกินเท่านี้ต่อการเปิดหนึ่งครั้ง
// spec ข้อ 9 ห้ามทำระบบแบ่งหน้า (pagination) ให้จำกัดจำนวนแทน
var จำนวนสูงสุดที่ดึง = 50;

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  if (!ตั้งค่าครบแล้ว) {
    showConfigWarning("ยังไม่ได้ใส่ค่าตั้งค่าใน js/firebase.js");
    กล่อง.innerHTML = "<p>ยังอ่านข้อมูลจากฐานข้อมูลจริงไม่ได้</p>";
    return;
  }

  var ใบลาจากฐาน;
  try {
    ใบลาจากฐาน = await ดึงใบลาจากฐานข้อมูล();
  } catch (err) {
    แสดงข้อผิดพลาด(err, กล่อง);
    return;
  }

  // ใบที่เพิ่งยื่นในหน้าฟอร์ม ยังเก็บไว้ในหน่วยความจำของเบราว์เซอร์ชั่วคราว
  // เพราะฟอร์มยังบันทึกลงฐานจริงไม่ได้จนกว่าจะถึงสัปดาห์ที่ 7
  // 🗑️ สัปดาห์ที่ 7 ให้ลบ 2 บรรทัดนี้ทิ้ง พร้อมกับตอนที่ฟอร์มเขียนลงฐานได้แล้ว
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");

  // ใบที่เพิ่งยื่นคือใบใหม่ที่สุด จึงวางไว้บนสุดให้เข้ากับการเรียงจากใหม่ไปเก่า
  var ใบลาทั้งหมด = ใบลาที่ยื่นใหม่.slice().reverse().concat(ใบลาจากฐาน);

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  // จงใจกรองตรงนี้ ไม่กรองที่ Firestore — เพราะกรองพร้อมเรียงลำดับ
  // Firestore จะบังคับให้ไปสร้าง index ก่อน ซึ่งไม่คุ้มกับข้อมูลไม่กี่ใบ
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด, กล่อง);
})();

// ── อ่านจาก Firestore ────────────────────────────────────────
async function ดึงใบลาจากฐานข้อมูล() {
  // createdAt เก็บเป็นข้อความรูปแบบ "2026-09-01 09:15"
  // รูปแบบนี้เรียงตามตัวอักษรแล้วได้ลำดับเวลาที่ถูกต้องพอดี จึงเรียงตรง ๆ ได้เลย
  var คำสั่ง = query(
    collection(db, "leaveRequests"),
    orderBy("createdAt", "desc"),
    limit(จำนวนสูงสุดที่ดึง)
  );

  var ผล = await getDocs(คำสั่ง);

  return ผล.docs.map(function (ไฟล์) {
    // ⚠️ บน Firestore ชื่อไฟล์ (lr001) ไม่ได้อยู่ในช่องข้อมูล ต้องประกอบกลับเข้าไปเอง
    //    ถ้าลืมข้อนี้ ตารางจะขึ้นครบสวยงาม แต่กดแถวแล้วจะไปหน้า "ไม่พบใบขอลาที่ต้องการ" ทุกแถว
    return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
  });
}

// ── วาดตาราง ─────────────────────────────────────────────────
function แสดงตาราง(รายการ, กล่อง) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
    return;
  }

  var html =
    "<table><thead><tr>" +
    "<th>หัวข้อ</th>" +
    "<th>ประเภทการลา</th>" +
    "<th>สถานะ</th>" +
    '<th class="hide-mobile">ผู้ขอลา</th>' +
    '<th class="hide-mobile">วันที่ลา</th>' +
    "</tr></thead><tbody>";

  รายการ.forEach(function (ใบ) {
    html +=
      '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
      "<td>" + esc(ใบ.title) + "</td>" +
      "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
      "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
      "</tr>";
  });

  html += "</tbody></table>";
  กล่อง.innerHTML = html;

  // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
  กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
    แถว.addEventListener("click", function () {
      location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
    });
  });
}

// ── บอกให้ชัดว่าพังเพราะอะไร ไม่ปล่อยหน้าว่างเปล่า ───────────
function แสดงข้อผิดพลาด(err, กล่อง) {
  var รหัส = err && err.code ? err.code : "ไม่ทราบสาเหตุ";
  var คำแนะนำ = {
    "permission-denied": "Security Rules ไม่ยอมให้อ่าน — ตรวจว่าสร้างฐานแบบ test mode หรือ test mode หมดอายุ 30 วันแล้ว",
    "failed-precondition": "Firestore ขอให้สร้าง index ก่อน — เปิดลิงก์ในข้อความข้างล่างแล้วกดสร้างได้เลย",
    "unavailable": "ต่อ Firestore ไม่ได้ — ตรวจอินเทอร์เน็ต หรือยังไม่ได้สร้างฐานข้อมูลใน Console",
    "not-found": "ยังไม่ได้สร้างฐานข้อมูล Firestore ในโปรเจกต์นี้"
  }[รหัส];

  var กล่องเตือน = document.createElement("div");
  กล่องเตือน.className = "alert alert-error";
  กล่องเตือน.textContent =
    "อ่านข้อมูลจาก Firestore ไม่สำเร็จ · รหัส " + รหัส +
    (คำแนะนำ ? " — " + คำแนะนำ : "");

  var รายละเอียด = document.createElement("div");
  รายละเอียด.className = "hint";
  รายละเอียด.textContent = err && err.message ? err.message : String(err);

  กล่อง.innerHTML = "";
  กล่อง.appendChild(กล่องเตือน);
  กล่อง.appendChild(รายละเอียด);
}
