// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 6 (ต้นสัปดาห์): อ่านจากข้อมูลปลอม และเปลี่ยนสถานะในหน่วยความจำ
// ─────────────────────────────────────────────────────────────

(function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  // หาใบลาจากข้อมูลปลอม บวกกับใบที่เพิ่งยื่นในหน้าที่ 2
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  var ใบ = window.LEAVE_DATA.leaveRequests.concat(ใบลาที่ยื่นใหม่)
    .find(function (x) { return x.id === รหัสใบลา; });

  if (!ใบ) {
    document.getElementById("หัวเรื่อง").textContent = "ไม่พบใบขอลาที่ต้องการ";
    document.getElementById("คำโปรย").textContent =
      "ใบนี้อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง";
    กล่องใบลา.innerHTML =
      '<div class="empty-state">' +
      '<div class="mark">' + ไอคอน("inbox") + "</div>" +
      "<h2>เปิดใบลานี้ไม่ได้</h2>" +
      "<p>ลองกลับไปเลือกใบลาจากหน้ารายการอีกครั้ง</p>" +
      '<div class="btn-row">' +
      '<a class="btn" href="leave-requests.html">ไปหน้ารายการใบลา</a>' +
      "</div></div>";
    return;
  }

  var ความเห็น = window.LEAVE_DATA.approvals.filter(function (c) { return c.requestId === ใบ.id; });

  วาดหัวเรื่อง();
  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── หัวเรื่องของหน้า ──
  // เอาหัวข้อใบลาขึ้นเป็นหัวเรื่อง เพื่อให้รู้ทันทีว่ากำลังเปิดใบไหนอยู่
  // ทั้งบนหน้าจอ บนแท็บเบราว์เซอร์ และในประวัติการเข้าชม
  function วาดหัวเรื่อง() {
    document.getElementById("หัวเรื่อง").textContent = ใบ.title;
    document.getElementById("คำโปรย").textContent =
      ใบ.leaveTypeName + " · ยื่นเมื่อ " + ใบ.createdAt;
    document.title = ใบ.title + " · LeaveEasy";
  }

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    // ไม่ต้องมีแถว "หัวข้อ" แล้ว เพราะยกขึ้นไปเป็นหัวเรื่องของหน้าแทน
    var แถว = [
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    if (ใบ.status === "รอพิจารณา") {
      // แยกออกมาเป็นโซนของตัวเอง เพราะกดแล้วเปลี่ยนกลับไม่ได้
      // ไม่ควรวางปนกับปุ่มธรรมดาจนกดพลาด
      html +=
        '<div class="btn-row danger-zone">' +
        '<p class="hint">การพิจารณาทำได้ครั้งเดียว กดแล้วเปลี่ยนสถานะต่อไม่ได้</p>' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    }
  }

  // ── เปลี่ยนสถานะ (สัปดาห์นี้เปลี่ยนแค่ในหน่วยความจำ) ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
    ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
    วาดใบลา();
    ประกาศ("เปลี่ยนสถานะเป็น " + สถานะใหม่ + " แล้ว");
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือนพร้อมไอคอน(เตือน, "error", "พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้");
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    // สัปดาห์ที่ 6 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
    ความเห็น.push({
      id: "ap-ใหม่-" + Date.now(),
      requestId: ใบ.id,
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    });
    ช่อง.value = "";
    วาดความเห็น();
  }
  // ── บอกผลลัพธ์ให้คนที่ใช้โปรแกรมอ่านหน้าจอรู้ด้วย ──
  // การกดปุ่มแล้วหน้าจอเปลี่ยน คนที่มองเห็นรู้ทันที แต่คนที่ฟังต้องมีคนบอก
  function ประกาศ(ข้อความ) {
    var ที่วาง = document.getElementById("ประกาศผล");
    if (!ที่วาง) {
      ที่วาง = document.createElement("div");
      ที่วาง.id = "ประกาศผล";
      ที่วาง.className = "alert alert-ok";
      ที่วาง.setAttribute("role", "status");
      กล่องใบลา.parentNode.insertBefore(ที่วาง, กล่องใบลา);
    }
    ที่วาง.textContent = ข้อความ;
  }
})();
