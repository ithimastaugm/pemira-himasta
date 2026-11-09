"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Finish() {
  const router = useRouter()
  const [dataState, setDataState] = useState("out")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDataState("in")
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className=" bg-navy text-center text-white">
      <div className="flex justify-center mb-8">
        <span className="t-success-check" data-state={dataState} aria-hidden="true">
          <svg className="w-24 h-24 text-yellow" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="20" className="opacity-20" />
            <path d="M14 24l8 8 12-16" />
          </svg>
        </span>
      </div>
      <p className="mb-16 px-12 text-lg lg:text-xl 2xl:text-3xl">
        Terima kasih sudah berpartisipasi dalam rangkaian Pemilihan Raya Himasta
        2026. <br />
        Ditunggu kedatanganmu di Pemilihan Raya Himasta 2027.
      </p>
      <button
        onClick={() => router.push("/")}
        className="w-48 rounded-md bg-yellow px-[10px] py-3 text-xl text-black transition ease-in-out hover:scale-105 active:scale-100 active:brightness-75 2xl:w-[216px] 2xl:text-2xl"
      >
        Kembali ke Home
      </button>
    </div>
  )
}

