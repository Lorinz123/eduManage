
function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Student Management System
        </h1>

        <p className="mt-3 text-slate-600">
          Tailwind CSS is configured and working.
        </p>

        <button className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
          Get Started
        </button>
      </section>
    </main>
  );
}

export default HomePage;
