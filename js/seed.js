// ─────────────────────────────────────────────────────────────
// js/seed.js — เครื่องมือใช้ครั้งเดียว สำหรับใส่ข้อมูลตัวอย่างลง Firestore
//
// อ่านข้อมูลจาก js/data.js ที่มีอยู่แล้ว แล้วเขียนขึ้น Firestore
// จงใจไม่พิมพ์ชื่อช่องข้อมูลใหม่ เพราะ status กับ Status คือคนละช่อง
// และพิมพ์ผิดทีเดียวระบบพังแบบเงียบ ๆ หาสาเหตุไม่เจอ
//
// ไฟล์นี้เขียนทับอย่างเดียว ไม่มีคำสั่งลบ · กดซ้ำได้ข้อมูลไม่ซ้ำ
// ─────────────────────────────────────────────────────────────

import { db, ตั้งค่าครบแล้ว } from "./firebase.js";
import {
  doc, setDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var ปุ่ม = document.getElementById("ปุ่มใส่ข้อมูล");
var ที่วางผล = document.getElementById("ผลการทำงาน");

if (!ตั้งค่าครบแล้ว) {
  บอก("ยังไม่ได้ใส่ค่าตั้งค่า Firebase ใน js/firebase.js", "error");
  ปุ่ม.disabled = true;
} else {
  ปุ่ม.addEventListener("click", ใส่ข้อมูลทั้งหมด);
}

// ── ตัวหลัก ──────────────────────────────────────────────────
async function ใส่ข้อมูลทั้งหมด() {
  ปุ่ม.disabled = true;                 // กันกดรัวจนเขียนซ้อนกัน
  ที่วางผล.innerHTML = "";
  var ข้อมูล = window.LEAVE_DATA;

  try {
    บอก("เริ่มเขียนข้อมูลลง Firestore…");

    // 1) users — ชื่อไฟล์คือ u001 u002 u003
    for (var ผู้ใช้ of ข้อมูล.users) {
      await เขียน(["users", ผู้ใช้.id], ผู้ใช้, ["id"]);
    }

    // 2) leaveTypes — ชื่อไฟล์คือ lt001 lt002 lt003
    for (var ประเภท of ข้อมูล.leaveTypes) {
      await เขียน(["leaveTypes", ประเภท.id], ประเภท, ["id"]);
    }

    // 3) leaveRequests — ชื่อไฟล์คือ lr001 … lr005
    for (var ใบลา of ข้อมูล.leaveRequests) {
      await เขียน(["leaveRequests", ใบลา.id], ใบลา, ["id"]);
    }

    // 4) approvals — โฟลเดอร์ย่อยที่ซ้อนอยู่ในใบลาแต่ละใบ
    //    เส้นทางคือ leaveRequests/lr001/approvals/ap001
    //    ตัด requestId ทิ้งด้วย เพราะเส้นทางบอกอยู่แล้วว่าเป็นความเห็นของใบไหน
    for (var ความเห็น of ข้อมูล.approvals) {
      await เขียน(
        ["leaveRequests", ความเห็น.requestId, "approvals", ความเห็น.id],
        ความเห็น,
        ["id", "requestId"]
      );
    }

    บอก("เขียนครบแล้ว กำลังอ่านกลับมาตรวจนับ…");
    await ตรวจนับ();
    บอก("เสร็จสมบูรณ์ — เปิด Firebase Console ดูได้เลย", "ok");

  } catch (err) {
    แสดงข้อผิดพลาด(err);
  } finally {
    ปุ่ม.disabled = false;
  }
}

// ── เขียนหนึ่งไฟล์ ───────────────────────────────────────────
// เส้นทาง = ["users","u001"] · ตัดออก = ชื่อช่องที่ไม่ต้องเขียนลงไป
async function เขียน(เส้นทาง, ก้อนข้อมูล, ตัดออก) {
  var ช่องที่จะเขียน = {};
  Object.keys(ก้อนข้อมูล).forEach(function (ชื่อช่อง) {
    // id ไม่ใช่ช่องข้อมูลบน Firestore แต่เป็น "ชื่อไฟล์" จึงต้องไม่เขียนซ้ำเข้าไปข้างใน
    if (ตัดออก.indexOf(ชื่อช่อง) === -1) {
      ช่องที่จะเขียน[ชื่อช่อง] = ก้อนข้อมูล[ชื่อช่อง];
    }
  });

  // setDoc = บังคับชื่อไฟล์เอง · ถ้าใช้ addDoc จะได้รหัสสุ่มยาว ๆ แล้วลิงก์หน้ารายละเอียดพังหมด
  await setDoc(doc(db, ...เส้นทาง), ช่องที่จะเขียน);
  บอก("เขียนแล้ว  " + เส้นทาง.join("/"));
}

// ── อ่านกลับมานับ เพื่อพิสูจน์ว่าขึ้นจริง ────────────────────
async function ตรวจนับ() {
  var users = await getDocs(collection(db, "users"));
  var leaveTypes = await getDocs(collection(db, "leaveTypes"));
  var leaveRequests = await getDocs(collection(db, "leaveRequests"));

  var จำนวนความเห็น = 0;
  for (var ไฟล์ใบลา of leaveRequests.docs) {
    var ความเห็น = await getDocs(collection(db, "leaveRequests", ไฟล์ใบลา.id, "approvals"));
    จำนวนความเห็น += ความเห็น.size;
  }

  บอก("นับได้จริงบน Firestore:");
  บอก("   users " + users.size + " ไฟล์");
  บอก("   leaveTypes " + leaveTypes.size + " ไฟล์");
  บอก("   leaveRequests " + leaveRequests.size + " ไฟล์");
  บอก("   approvals รวมทุกใบ " + จำนวนความเห็น + " ไฟล์");
}

// ── แสดงผลบนหน้าจอ ──────────────────────────────────────────
// ใช้ textContent ไม่ใช่ innerHTML เพื่อไม่ให้ข้อความในข้อมูลไปแทรกโค้ดในหน้าเว็บได้
function บอก(ข้อความ, ชนิด) {
  var บรรทัด = document.createElement("div");
  if (ชนิด === "ok") บรรทัด.className = "alert alert-ok";
  if (ชนิด === "error") บรรทัด.className = "alert alert-error";
  บรรทัด.textContent = ข้อความ;
  ที่วางผล.appendChild(บรรทัด);
}

function แสดงข้อผิดพลาด(err) {
  var รหัส = err && err.code ? err.code : "ไม่ทราบสาเหตุ";
  var คำแนะนำ = {
    "permission-denied": "Security Rules ไม่ยอมให้เขียน — ตรวจว่าสร้างฐานแบบ test mode หรือ test mode หมดอายุ 30 วันแล้ว",
    "unavailable": "ต่อ Firestore ไม่ได้ — ตรวจอินเทอร์เน็ต หรือยังไม่ได้สร้างฐานข้อมูลใน Console",
    "not-found": "ยังไม่ได้สร้างฐานข้อมูล Firestore ในโปรเจกต์นี้"
  }[รหัส];

  บอก("เขียนไม่สำเร็จ · รหัส " + รหัส, "error");
  if (คำแนะนำ) บอก(คำแนะนำ, "error");
  บอก("ข้อความเต็มจาก Firebase: " + (err && err.message ? err.message : String(err)), "error");
}
