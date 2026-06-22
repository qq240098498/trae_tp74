import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Scheduling from "@/pages/Scheduling";
import CheckIn from "@/pages/CheckIn";
import Commission from "@/pages/Commission";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/commission" element={<Commission />} />
        </Route>
      </Routes>
    </Router>
  );
}
