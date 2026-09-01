// ─────────────────────────────────────────────────────────────
// js/dashboard.js — หน้าที่ 5 แดชบอร์ดสรุป
//
// สัปดาห์ที่ 6 หน้านี้เป็นโครงหน้าจาก prototype ตามข้อกำหนดหัวข้อ 4
// ตัวเลขจึงนับจากข้อมูลตัวอย่างใน js/data.js ไม่ได้นับจาก Firestore
// การนับจากฐานข้อมูลจริงเป็นงานของสัปดาห์ที่ 7 (US-11)
//
// สัปดาห์ที่ 6 อนุญาตให้อ่านจากฐานจริงได้หน้าเดียวคือหน้ารายการใบลา
// จึงจงใจไม่ต่อ Firestore ที่หน้านี้ เพื่อไม่ให้ล้ำขอบเขตของสัปดาห์
// ─────────────────────────────────────────────────────────────

(function () {
  // สถานะทั้ง 3 ค่าตามข้อกำหนดหัวข้อ 6 · ลำดับนี้คือลำดับที่แสดงบนหน้าจอ
  var สถานะทั้งหมด = [
    { ชื่อ: "รอพิจารณา", ไอคอน: "clock" },
    { ชื่อ: "อนุมัติ",    ไอคอน: "check-circle" },
    { ชื่อ: "ไม่อนุมัติ", ไอคอน: "x-circle" }
  ];

  // ใบที่เพิ่งยื่นในหน้าฟอร์มยังอยู่ในหน่วยความจำของเบราว์เซอร์เท่านั้น
  // นับรวมด้วย เพื่อให้ตัวเลขตรงกับที่เห็นในหน้ารายการ
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  var ใบลาทั้งหมด = window.LEAVE_DATA.leaveRequests.concat(ใบลาที่ยื่นใหม่);

  วาดกล่องตัวเลข();
  วาดใบลาล่าสุด();

  // ── กล่องตัวเลข 3 กล่อง กดแล้วไปหน้ารายการที่กรองสถานะนั้นไว้ ──
  function วาดกล่องตัวเลข() {
    var ที่วาง = document.getElementById("กล่องตัวเลข");

    ที่วาง.innerHTML = สถานะทั้งหมด.map(function (ส) {
      var จำนวน = ใบลาทั้งหมด.filter(function (ใบ) {
        return ใบ.status === ส.ชื่อ;
      }).length;

      // เป็นลิงก์จริง ไม่ใช่ div ที่ดักคลิก จะได้กด Tab ถึงและเปิดแท็บใหม่ได้
      return '<a class="stat" href="leave-requests.html?status=' +
             encodeURIComponent(ส.ชื่อ) + '">' +
             ไอคอน(ส.ไอคอน, "stat-icon") +
             '<div class="number">' + จำนวน + "</div>" +
             "<div>" + esc(ส.ชื่อ) + "</div>" +
             "</a>";
    }).join("");
  }

  // ── ใบลา 5 รายการล่าสุด เรียงจากใหม่ไปเก่า ──
  function วาดใบลาล่าสุด() {
    var ที่วาง = document.getElementById("ใบลาล่าสุด");

    // createdAt เก็บเป็นข้อความรูปแบบ ปี-เดือน-วัน ชั่วโมง:นาที
    // เรียงตามตัวอักษรแล้วได้ลำดับเวลาที่ถูกต้องพอดี
    var ล่าสุด = ใบลาทั้งหมด.slice().sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }).slice(0, 5);

    if (ล่าสุด.length === 0) {
      ที่วาง.innerHTML =
        '<div class="empty-state">' +
        '<div class="mark">' + ไอคอน("inbox") + "</div>" +
        "<h2>ยังไม่มีใบขอลาในระบบ</h2>" +
        "<p>ใบลาที่ยื่นเข้ามาจะมาแสดงที่นี่</p>" +
        '<div class="btn-row">' +
        '<a class="btn" href="new-leave-request.html">ยื่นใบลาใบแรก</a>' +
        "</div></div>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ยื่น</th>' +
      "</tr></thead><tbody>";

    ล่าสุด.forEach(function (ใบ) {
      var ที่อยู่ = "leave-request-detail.html?id=" + encodeURIComponent(ใบ.id);
      html +=
        "<tr>" +
        '<td><a class="row-link" href="' + esc(ที่อยู่) + '">' + esc(ใบ.title) + "</a></td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.createdAt) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    html += '<div class="btn-row">' +
            '<a class="btn btn-ghost" href="leave-requests.html">ดูใบลาทั้งหมด</a>' +
            "</div>";
    ที่วาง.innerHTML = html;
  }
})();
