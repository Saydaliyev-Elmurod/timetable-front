# Jadval Tahrirlash API - Qisqacha Ma'lumot

## 📋 Umumiy Ma'lumot

Men sizning tavsiyangiz bo'yicha **action-based (harakat asosidagi)** API dizaynini to'liq amalga oshirdim. Bu tizim darslarni sudrab ko'chirish (drag-and-drop) orqali jadvallarni tahrirlashni ta'minlaydi.

## ✅ Amalga Oshirilgan Funksiyalar

### 1. Uchta Asosiy Harakat (Action)

#### **MOVE_LESSON** - Darsni Bo'sh Joyga Ko'chirish
```
Foydalanuvchi: Matematika darsini Dushanba 2-soatdan olib, 
                bo'sh turgan Chorshanba 4-soatga qo'yadi
                
Backend tekshiradi:
✓ O'qituvchi bo'shmi?
✓ Sinf bo'shmi?  
✓ Xona bo'shmi?
✓ Maqsad katagi bo'shmi?
```

#### **SWAP_LESSONS** - Ikkita Darsni Almashtirish
```
Foydalanuvchi: Matematika darsini olib, Fizika dars turgan 
                joyga tashlaydi (o'rnini almashtirish)
                
Backend tekshiradi:
✓ Matematika o'qituvchisi Fizika vaqtida bo'shmi?
✓ Fizika o'qituvchisi Matematika vaqtida bo'shmi?
✓ Ikkala sinf ham yangi vaqtlarda bo'shmi?
```

#### **PLACE_UNPLACED_LESSON** - Joylashtirilmagan Darsni Qo'yish
```
Foydalanuvchi: "Joylashtirilmagan darslar" panelidan 
                darsni olib, jadvalga qo'yadi
                
Backend tekshiradi:
✓ Barcha cheklovlar (o'qituvchi, sinf, xona)
✓ Dars haqiqatan joylashtirilmaganmi?
```

### 2. Ikki Bosqichli Jarayon

```
1️⃣ VALIDATE (Tezkor Tekshiruv)
   POST /api/timetables/{id}/validate-move
   → Tez javob beradi, ma'lumotni o'zgartirmaydi
   → Foydalanuvchiga darhol feedback ko'rsatadi

2️⃣ APPLY (Yakuniy Amal)  
   POST /api/timetables/{id}/apply-action
   → Barcha cheklovlarni QAYTA tekshiradi
   → Ma'lumotlar bazasiga saqlaydi
   → Versiyani oshiradi
```

### 3. Optimistic Locking (Version Nazorati)

```javascript
// Muammo: Ikki foydalanuvchi bir vaqtda tahrirlaydi
👤 Foydalanuvchi A: jadvalga kiradi (version 1)
👤 Foydalanuvchi B: jadvalga kiradi (version 1)  

👤 A: Matematika darsini ko'chiradi → saqlaydi
     ✅ Server: Version 1 ✓ → Version 2 ga o'zgartiradi

👤 B: Fizika darsini ko'chirish uchun version 1 yuboradi
     ❌ Server: Version 1 emas, 2! → XATOLIK qaytaradi
     
👤 B: Yangilaydi, eng so'nggi holatni ko'radi
     ✅ Server: Endi version 2 bilan ishlaydi
```

**Natija**: Hech kim hech kimning o'zgarishlarini "ezib" qo'ya olmaydi! 🎉

### 4. Qat'iy Cheklovlar (Hard Constraints)

Agar bu cheklovlar buzilsa, harakat **RAD ETILADI**:

- ❌ O'qituvchi bir vaqtda ikki joyda bo'lolmaydi
- ❌ Sinf bir vaqtda ikki dars bo'lolmaydi  
- ❌ Xona bir vaqtda ikki dars uchun ishlatilmaydi
- ❌ Band kataklarga qo'yib bo'lmaydi
- ❌ Qulflangan (locked) darslar ko'chirilmaydi

### 5. Yumshoq Cheklovlar (Soft Constraints)

Bu cheklovlar buzilsa, harakat **BAJARILADI**, lekin ogohlantirish beriladi:

- ⚠️ Jadvalda "oyna" (bo'sh soat) paydo bo'ldi
- ⚠️ Bir kunda juda ko'p dars to'plandi
- ⚠️ O'qituvchining afzal vaqti emas
- ⚠️ Sifat ballı pasaydi (85% → 78%)

**Javobda qaytadi**:
```json
{
  "success": true,
  "new_version": 2,
  "soft_constraint_impact": {
    "new_quality_score": 85,
    "warnings": [
      "10-A sinfda Dushanba kuni 2 va 4-soat orasida oyna paydo bo'ldi",
      "O'qituvchi Jonning Chorshanba kunida 5 ta darsi bor (ko'p!)"
    ],
    "new_gaps": [
      { "entity_type": "CLASS", "entity_id": 5, "day": "MONDAY" }
    ]
  }
}
```

## 🎯 Asosiy Afzalliklar

### ✅ **Server Nazorati**
Front-end validatsiyasiga 100% ishonmaslik. Yakuniy validatsiya doim back-endda.

### ✅ **Atomarlik**  
Har bir harakat - bitta, aniq, mantiqan tugallangan operatsiya.

### ✅ **Xavfsizlik**
Optimistic locking bilan bir vaqtdagi tahrirlashlar to'qnashmaydi.

### ✅ **Ma'lumotlilik**
Nafaqat "OK" yoki "ERROR", balki:
- Nima o'zgardi?
- Sifatga ta'siri qanday?
- Qanday ogohlantirishlar bor?
- Yangi versiya raqami nechchi?

### ✅ **Moslashuvchanlik**
Yangi action turlarini osongina qo'shish mumkin.

## 🔧 Texnik Tafsilotlar

### API So'rovlar Formati

**Move Lesson**:
```json
{
  "action_type": "MOVE_LESSON",
  "timetable_version": 1,
  "payload": {
    "lesson_id": "lesson-uuid-123",
    "source_position": { "day": "MONDAY", "hour": 2, "room_id": 101 },
    "target_position": { "day": "WEDNESDAY", "hour": 4, "room_id": 101 }
  }
}
```

**Swap Lessons**:
```json
{
  "action_type": "SWAP_LESSONS",
  "timetable_version": 2,
  "payload": {
    "lesson_a": {
      "id": "lesson-uuid-123",
      "source_position": { "day": "MONDAY", "hour": 2, "room_id": 101 }
    },
    "lesson_b": {
      "id": "lesson-uuid-456",
      "source_position": { "day": "WEDNESDAY", "hour": 4, "room_id": 202 }
    }
  }
}
```

**Place Unplaced Lesson**:
```json
{
  "action_type": "PLACE_UNPLACED_LESSON",
  "timetable_version": 3,
  "payload": {
    "lesson_id": "lesson-uuid-789",
    "target_position": { "day": "THURSDAY", "hour": 1, "room_id": 303 }
  }
}
```

## 🚀 Foydalanish

### Frontend Tomonidan

```typescript
import { timetableActionApi } from '../api/timetableActionApi';

// 1. Darsni sudrab olib ketish
const handleDrop = async (lesson, targetDay, targetSlot) => {
  
  // 2. Harakat turini aniqlash
  const actionType = determineActionType(lesson, targetDay, targetSlot);
  
  // 3. So'rov tayyorlash
  const request = {
    action_type: actionType,
    timetable_version: timetableVersion,
    payload: buildPayload(lesson, targetDay, targetSlot)
  };
  
  // 4. Validatsiya qilish (ixtiyoriy)
  const validation = await timetableActionApi.validateMove(
    timetableId, 
    request
  );
  
  if (!validation.valid) {
    toast.error(validation.errors.join(', '));
    return;
  }
  
  // 5. Harakatni amalga oshirish
  const result = await timetableActionApi.applyAction(
    timetableId,
    request
  );
  
  if (result.success) {
    // 6. Versiyani yangilash
    setTimetableVersion(result.new_version);
    
    // 7. UI ni yangilash
    updateLessonPosition(lesson, targetDay, targetSlot);
    
    // 8. Muvaffaqiyat xabari
    toast.success(result.message);
    
    // 9. Yumshoq cheklovlar ta'sirini ko'rsatish
    if (result.soft_constraint_impact?.warnings) {
      toast.info(result.soft_constraint_impact.warnings.join(', '));
    }
  } else {
    toast.error(result.errors.join(', '));
  }
};
```

## 🧪 Mock API

Hozircha backend yo'q, shuning uchun **mock API** ishlatiladi:

```typescript
// components/api/timetableActionApi.ts
const USE_MOCK_API = true; // Backend tayyor bo'lgach false qiling

// Mock API xuddi real API kabi ishlaydi:
// - 300ms network delay simulyatsiya qiladi
// - Barcha validatsiyalarni bajaradi
// - In-memory da ma'lumotlarni saqlaydi
// - Version nazoratini amalga oshiradi
```

Backend tayyor bo'lgach:
```typescript
const USE_MOCK_API = false; // Faqat shu satrni o'zgartiring!
```

Barcha API chaqiruvlar avtomatik ravishda real backend `http://localhost:8080` ga ulanadi.

## 📊 Ko'rsatkichlar (Indicators)

### Ekranda Ko'rsatiladigan Ma'lumotlar

1. **Version raqami**: Joriy jadval versiyasi (v1, v2, v3...)
2. **Schedule Integrity**: Qancha darslar joylashtirilgan (%)
3. **Conflicts**: Muammolar soni
4. **Quality Score**: Yumshoq cheklovlar asosida sifat balli (0-100%)

### Jarayon Ko'rsatkichi

Harakat bajarilayotganda:
```
┌─────────────────────────────────────┐
│ ⏳ Processing action... Please wait.│  
└─────────────────────────────────────┘
```

## 📝 Kodda Amalga Oshirilgan

### Yangilangan Fayllar

1. **`/components/api/timetableActionApi.ts`** (YANGI)
   - Uchta action turi
   - Validate va Apply funksiyalari
   - Mock API implementatsiyasi
   - Version nazorati

2. **`/components/pages/TimetableViewPageWithAPI.tsx`** (YANGILANGAN)
   - `handleDrop` funksiyasi action-based API bilan ishlaydi
   - Version tracking qo'shildi
   - Soft constraint impact ko'rsatiladi
   - Processing indicator qo'shildi

3. **`/TIMETABLE_ACTIONS_API.md`** (YANGI)
   - To'liq inglizcha dokumentatsiya
   - API endpoint'lar tavsifi
   - Misol so'rov va javoblar
   - Best practices

4. **`/TIMETABLE_ACTIONS_UZ.md`** (YANGI - shu fayl)
   - O'zbekcha qisqacha qo'llanma

## 🎬 Ishga Tushirish

Hozir system tayyor! Foydalanuvchi:

1. ✅ Darslarni sudrab ko'chirishi mumkin
2. ✅ Ikkita darsni almashtirilishi mumkin  
3. ✅ Joylashtirilmagan darslarni jadvalga qo'yishi mumkin
4. ✅ Real-time validatsiya oladi
5. ✅ Soft constraint ta'sirini ko'radi
6. ✅ Version conflict xatolaridan himoyalangan

**Mock API** bilan hamma narsa ishlaydi. Backend tayyor bo'lgach, faqat bitta `USE_MOCK_API = false` qilish kifoya! 🚀

## 📞 Savol va Javoblar

**S: Backend qanday javob berishi kerak?**  
J: To'liq spetsifikatsiya `TIMETABLE_ACTIONS_API.md` faylida. Backend shunchaki JSON formatda request qabul qiladi va response qaytaradi.

**S: Agar ikki foydalanuvchi bir vaqtda tahrirlasa?**  
J: Version nazorati (optimistic locking) shu muammoni hal qiladi. Ikkinchi foydalanuvchi version conflict xatosi oladi va yangilashi so'raladi.

**S: Soft constraint'lar qachon tekshiriladi?**  
J: Har bir harakatdan keyin. Backend quality score va warnings qaytaradi.

**S: Mock API real API bilan bir xilmi?**  
J: Ha! Interface bir xil. Backend tayyor bo'lgach, faqat flag o'zgartirish kifoya.

---

**Tayyorlagan**: AI Assistant  
**Sana**: 2025-10-26  
**Versiya**: 1.0
