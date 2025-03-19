import "./App.css";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Hello, Tailwind CSS!</h1>
      <p className="mt-4 text-gray-700">
        If this text is styled, Tailwind is working! 🎉
      </p>
      <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
        Click Me
      </button>
      <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
        Tailwind is working!
      </div>
    </div>
  );
}

export default App;
