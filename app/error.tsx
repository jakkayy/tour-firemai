"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-zinc-200 mb-4">500</p>
        <h1 className="text-xl font-semibold text-zinc-800 mb-2">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-zinc-500 mb-6">ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง</p>
        <button
          onClick={reset}
          className="bg-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-400 transition-colors"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
