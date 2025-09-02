import React from 'react'

const ScreeningResultPage = () => {
  return (
   <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg  md:w-full max-w-2xl flex flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Oh Sorry!</h1>

      <p className="text-gray-700 mb-4 text-lg">
        You could not clear the Navgurukul Preliminary Test this time. You have
        scored <span className="font-bold">6</span> marks in the test. Don't
        worry, you can give the test again after some preparation.
      </p>

      <p className="text-gray-700 mb-6">
        You can use this study guide for more maths practice{" "}
        <a
          href="#"
          className="text-blue-600 font-medium underline hover:text-blue-800"
        >
          Click Here
        </a>
        . Prepare, Practice and Pass :)
      </p>

      <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
        OK
      </button>
    </div>
  </div>
  )
}

export default ScreeningResultPage