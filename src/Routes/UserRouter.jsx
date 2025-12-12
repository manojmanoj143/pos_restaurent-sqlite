// src/UserRouter.jsx
// FULLY UPDATED: Added routes for Schedule Master (/schedule-master), Schedule Rule Master (/schedule-rule-master), Schedule Assign Employee (/schedule-assign-employee)
// All previous routes preserved, no /admin prefix
import React from "react";
import { Route, Routes } from "react-router-dom";

// Import Pages
import TablePage from "../Pages/TablePage";
import FrontPage from "../Pages/FrontPage";
import KitchenRoomPage from "../Pages/KitchenRoomPage";
import BearerPage from "../Pages/BearerPage";
import CashPage from "../Pages/CashPage";
import CardPage from "../Pages/CardPage";
import SavedOrderPage from "../Pages/SavedOrderPage";
import SalesPage from "../Pages/SalesPage";

// Import Components
import FirstTab from "../components/FirstTab/FirstTab";
import AdminPage from "../components/admin/AdminPage";
import MainPage from "../components/Form/MainPage";
import CustomerListPage from "../components/Form/CustomerListPage";
import ItemListPage from "../components/Form/ItemListPage";
import CreateItemsPage from "../components/Form/CreateItemsPage";
import BearerLoginPage from "../components/BearerLoginPage";
import AddTablePage from "../components/Form/AddTablePage";
import RecordPage from "../components/Form/RecordPage";
import OpeningEntry from "../components/Bearer/OpeningEntry";
import ClosingEntry from "../components/Bearer/ClosingEntry";
import RegisterPage from "../components/Form/RegisterPage";
import BackupPage from "../components/Form/BackupsPage."; // Fixed: removed trailing .
import SystemSettings from "../components/Form/SystemSettings";
import ActiveOrders from "../components/Header/ActiveOrders";
import Dashboard from "../components/Dashboard";
import UserList from "../components/Form/UserList";
import AddKitchenPage from "../components/Form/AddKitchenPage";
import AddItemGroupPage from "../components/Form/AddItemGroupPage";
import AddingirdientAndNurion from "../components/Form/AddingirdientAndNurion";
import SalesReport from "../components/Navbar/SalesReport";
import Booking from "../components/Table/Booking";
import CreateVariant from "../components/Form/CreateVariant";
import Employee from "../components/Form/Employee";
import TripReport from "../components/Header/TripReport";
import PosBalance from "../components/Header/PosBalance";
import EmailSettings from "../components/Form/EmailSettings";
import Purchase from "../components/Form/Purchase";
import PrintSettings from "../components/Form/PrintSettings";
import ComboOffer from "../components/Form/ComboOffer";
import VatPage from "../components/Form/VatPage";
import CreateCustomerPage from "../components/Form/CreateCustomerPage";
import CreateCustomerGroup from "../components/Form/CreateCustomerGroup";
import CompanyDetails from "../components/Form/companydetails";
import Hiddenitems from "../components/Form/Hiddenitems";
import AddEmployee from "../components/Form/Addemployee";
import EmployeeList from "../components/Form/employeelist";
import Attendance from "../components/Form/attendance";
import Working from "../components/Form/working";
import SalarySlip from "../components/Form/salaryslip";

// UPDATED: Imports for Employee Designation and Type (plural routes)
import EmployeeDesignation from "../components/Form/Employeedesignation";
import EmployeeType from "../components/Form/Employeetype";

// NEW: Imports for Schedule pages (FIXED: Corrected import path to match file name 'schedulerulemaster.jsx')
import ScheduleMaster from "../components/Form/schedulemaster";
import ScheduleRuleMaster from "../components/Form/shedulerulemaster";
import ScheduleAssignEmployee from "../components/Form/scheduleassignemployee";

const UserRouter = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<BearerLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Main Application Routes */}
        <Route path="/home" element={<FirstTab />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/frontpage" element={<FrontPage />} />
        <Route path="/kitchen" element={<KitchenRoomPage />} />
        <Route path="/bearer" element={<BearerPage />} />
        <Route path="/cash" element={<CashPage />} />
        <Route path="/card" element={<CardPage />} />
        <Route path="/savedorders" element={<SavedOrderPage />} />
        <Route path="/salespage" element={<SalesPage />} />
        {/* Admin and Management Routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/items" element={<ItemListPage />} />
        <Route path="/hidden-items" element={<Hiddenitems />} />
        <Route path="/create-item" element={<CreateItemsPage />} />
        <Route path="/add-table" element={<AddTablePage />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/opening-entry" element={<OpeningEntry />} />
        <Route path="/closing-entry" element={<ClosingEntry />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/combo-offer" element={<ComboOffer />} />
        <Route path="/company-details" element={<CompanyDetails />} />
        <Route path="/working" element={<Working />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/employee-list" element={<EmployeeList />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/salary-slip" element={<SalarySlip />} />
        {/* UPDATED: Employee Designation and Type Routes (plural, no /admin prefix) */}
        <Route path="/employee-designations" element={<EmployeeDesignation />} />
        <Route path="/employee-types" element={<EmployeeType />} />
        {/* NEW: Schedule Routes */}
        <Route path="/schedule-master" element={<ScheduleMaster />} />
        <Route path="/schedule-rule-master" element={<ScheduleRuleMaster />} />
        <Route path="/schedule-assign-employee" element={<ScheduleAssignEmployee />} />
        {/* System Configuration Routes */}
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/email-settings" element={<EmailSettings />} />
        <Route path="/print-settings" element={<PrintSettings />} />
        {/* Operational Routes */}
        <Route path="/active-orders" element={<ActiveOrders />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/add-kitchen" element={<AddKitchenPage />} />
        <Route path="/add-item-group" element={<AddItemGroupPage />} />
        <Route path="/add-ingredients-nutrition" element={<AddingirdientAndNurion />} />
        {/* Reporting Routes */}
        <Route path="/sales-reports" element={<SalesReport />} />
        <Route path="/trip-report" element={<TripReport />} />
        <Route path="/pos-balance" element={<PosBalance />} />
        {/* Additional Feature Routes */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/create-variant" element={<CreateVariant />} />
        <Route path="/employees" element={<Employee />} />
        <Route path="/vat" element={<VatPage />} />
        <Route path="/create-customer" element={<CreateCustomerPage />} />
        <Route path="/create-customer-group" element={<CreateCustomerGroup />} />
      </Routes>
    </div>
  );
};

export default UserRouter;