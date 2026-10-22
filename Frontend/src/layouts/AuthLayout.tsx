
import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, ChartNoAxesColumnIncreasing, Users } from "lucide-react";
import hero from "@/assets/hero.png";
import Logo from "@/components/common/Logo";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blue-950 text-slate-900">
      <div className="absolute inset-0">
        <img
          src={hero}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/95 via-blue-800/80 to-sky-700/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-blue-700/20" />
      </div>

      <div className="pointer-events-none absolute -left-32 -top-40 size-[30rem] rounded-full border-[70px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-64 left-1/4 size-[40rem] rounded-full border-[90px] border-white/5" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <Logo />

          <p className="hidden items-center gap-3 text-[10px] font-semibold tracking-[0.24em] text-blue-100/90 sm:flex">
            LEARN <span>/</span> GROW <span>/</span> SUCCEED
          </p>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:py-12">
          <section className="hidden max-w-xl text-white lg:block">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">
              Your academic journey starts here
            </p>

            <h1 className="max-w-lg text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">
              Better Learning
              <br />
              Starts <span className="text-blue-200">Here.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-blue-50/90">
              Manage students, track enrollment, and build a smarter academic
              future — all in one place.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-5">
              {[
                { icon: Users, label: "Student", second: "Management" },
                { icon: BookOpen, label: "Easy", second: "Registration" },
                {
                  icon: ChartNoAxesColumnIncreasing,
                  label: "Real-Time",
                  second: "Reports",
                },
              ].map(({ icon: Icon, label, second }) => (
                <div key={label}>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/10">
                    <Icon size={21} />
                  </div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-sm text-blue-100">{second}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 flex items-center gap-2 text-sm italic text-blue-100">
              Empowering students. Supporting success.
              <ArrowUpRight size={16} />
            </div>
          </section>

          <section className="mx-auto w-full max-w-[480px]">
            {children}
          </section>
        </div>

        <footer className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-xs text-blue-100/80">
          <span>© {new Date().getFullYear()} eduManage</span>
          <span>Learn · Grow · Succeed</span>
        </footer>
      </div>
    </main>
  );
}
