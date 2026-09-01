# Checkpoint 4 — หน้ารายการอ่านจาก Firestore จริง

วันที่ 1 กันยายน 2569 · โปรเจกต์ Firebase `leaveeasy-korakot`

## เกณฑ์ผ่านตาม spec ข้อ 8

> เปิด Firebase Console เห็นข้อมูลตัวอย่าง · **แก้ข้อมูลใน Console แล้วหน้ารายการเปลี่ยนตาม**

## ภาพที่แนบ

| ไฟล์ | แสดงอะไร |
|---|---|
| `01-list-reads-firestore.jpg` | หน้ารายการดึงใบลา 5 ใบจากโฟลเดอร์ `leaveRequests` เรียงจากใหม่ไปเก่า |
| `02-external-edit-reflected.jpg` | หลังแก้ `title` ของ `lr001` จากภายนอก แถวที่ 4 เปลี่ยนตามโดยไม่แตะโค้ด |
| `03-permission-denied-message.jpg` | ตอน Security Rules ยังไม่ยอมให้อ่าน ระบบบอกรหัส `permission-denied` แทนหน้าว่างเปล่า |

## วิธีที่ใช้พิสูจน์

แก้ข้อมูลผ่าน **Firestore REST API** จาก Terminal แทนการแก้ใน Firebase Console
เป็นคนละโปรแกรมกับเว็บ จึงพิสูจน์เรื่องเดียวกันได้ว่าหน้าเว็บอ่านจากฐานจริง ไม่ได้อ่านไฟล์ในเครื่อง

```bash
KEY="<apiKey ของโปรเจกต์>"
BASE="https://firestore.googleapis.com/v1/projects/leaveeasy-korakot/databases/%28default%29/documents/leaveRequests/lr001"

# แก้เฉพาะช่อง title
curl -s -X PATCH "$BASE?key=$KEY&updateMask.fieldPaths=title" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"title":{"stringValue":"ลาพักร้อน — แก้จากนอกเว็บ 1 ก.ย. 69"}}}'
```

ผลที่ได้กลับมา `updateTime: 2026-09-01T09:26:20Z` แล้วรีเฟรชหน้าเว็บเห็นหัวข้อใหม่ทันที
หลังเก็บภาพเสร็จได้คืนค่า `title` กลับเป็นของเดิมแล้ว

## ข้อจำกัดของหลักฐานชุดนี้

**ไม่มีภาพจากหน้าจอ Firebase Console** เพราะเบราว์เซอร์ล็อกอินอยู่คนละบัญชี Google
กับบัญชีที่เป็นเจ้าของโปรเจกต์ `leaveeasy-korakot` (ขึ้นว่า *The project does not exist or you
do not have permission*) ถ้าใบงานบังคับว่าต้องเป็นภาพจาก Console ต้องถ่ายเพิ่มเอง

## ผลตรวจฐานข้อมูล

ตรวจทีละเอกสารผ่าน REST API เทียบกับ spec หัวข้อ 5.2 และ 7

```
users           3 เอกสาร   u001 u002 u003
leaveTypes      3 เอกสาร   lt001 lt002 lt003
leaveRequests   5 เอกสาร   lr001 ถึง lr005
approvals       4 รายการ   lr001 มี 2 · lr002 มี 1 · lr004 มี 1

สถานะ  รอพิจารณา 3 · อนุมัติ 1 · ไม่อนุมัติ 1
ผลตรวจ ชื่อช่องครบตาม spec ไม่มีช่องเกิน สถานะถูกต้องทุกใบ
```
