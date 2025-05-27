import Navbar from "../components/Navbar";
import ApprovalScanner from "../components/ApprovalScanner";
import DustScanner from "../components/DustScanner";
import ApproveForm from "../components/ApproveForm";

export default function Home() {
  return (
    <main className="min-h-screen text-white bg-bs-gray-700">
      <Navbar />
      <div className="flex flex-col items-center mt-10 space-y-6">
        <ApprovalScanner />
        <DustScanner />
        <ApproveForm />
      </div>
    </main>
  );
}
