export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center mb-8">
          Open Financial Terminal
        </h1>
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4">
          <h2 className="mb-3 text-2xl font-semibold">
            Terminal UI{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Bloomberg-style command palette and workspace
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4">
          <h2 className="mb-3 text-2xl font-semibold">
            OpenBB Integration{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            100+ data providers through OpenBB Platform
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4">
          <h2 className="mb-3 text-2xl font-semibold">
            Open Source{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            MIT licensed, community-driven development
          </p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm opacity-50">
          Foundation Phase - Implementation Coming Soon
        </p>
      </div>
    </main>
  )
}
