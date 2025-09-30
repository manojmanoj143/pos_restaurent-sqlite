import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './purchase.css';
// --- START: SVG Icon Components (Replaced react-icons) ---
const FaArrowLeft = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8 .4 34.3z"></path></svg>;
const FaShoppingCart = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H159.208l-9.166-44.81C147.758 8.021 137.93 0 126.541 0H24C10.745 0 0 10.745 0 24v16c0 13.255 10.745 24 24 24h69.883l70.248 343.435C147.325 417.1 136 435.222 136 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-15.674-6.447-29.835-16.824-40h209.647C430.447 426.165 424 440.326 424 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-22.172-12.888-41.332-31.579-50.405l5.517-24.276c3.413-15.018-8.002-29.319-23.403-29.319H218.117l-6.545-32h293.145c11.206 0 20.92-7.754 23.403-18.681z"></path></svg>;
const FaTruck = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"></path></svg>;
const FaFileInvoice = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM336 480H48V48h192v80c0 13.3 10.7 24 24 24h80v280zM112 248c-13.3 0-24 10.7-24 24v104c0 13.3 10.7 24 24 24h160c13.3 0 24-10.7 24-24V272c0-13.3-10.7-24-24-24H112zm152 112H120v-80h144v80z"></path></svg>;
const FaChartBar = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M500 384c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v308h436zM309.5 204.4l94.1-94.1c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17L346.3 241.1c-4.7 4.7-12.3 4.7-17 0l-45.2-45.2-112 112c-4.7 4.7-12.3 4.7-17 0l-47.9-47.9c-4.7-4.7-4.7-12.3 0-17l19.8-19.8c4.7-4.7 12.3-4.7 17 0l71.1 71.1 94.1-94.1c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17L218.3 253.1c-4.7 4.7-12.3 4.7-17 0l-45.2-45.2-44.4 44.4c-4.7 4.7-12.3 4.7-17 0l-19.8-19.8c-4.7-4.7-4.7-12.3 0-17l71.1-71.1 94.1 94.1z"></path></svg>;
const FaTrash = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path></svg>;
const FaUser = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>;
const FaPrint = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 192H64C28.7 192 0 220.7 0 256v96c0 35.3 28.7 64 64 64h32v56c0 13.3 10.7 24 24 24h272c13.3 0 24-10.7 24-24v-56h32c35.3 0 64-28.7 64-64v-96c0-35.3-28.7-64-64-64zM384 448H128v-48h256v48zm-48-224H176c-13.3 0-24 10.7-24 24s10.7 24 24 24h160c13.3 0 24-10.7 24-24s-10.7-24-24-24zM448 64h-48V16c0-8.8-7.2-16-16-16H128c-8.8 0-16 7.2-16 16v48H64c-35.3 0-64 28.7-64 64v32h512v-32c0-35.3-28.7-64-64-64z"></path></svg>;
const FaPlus = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg>;
const FaEdit = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.2 15.2-39.9 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>;
const FaCheck = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>;
const FaTimes = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>;
const FaFilter = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C521.021 25.896 510.312 0 488.03 0h-.054z"></path></svg>;
const FaFileExcel = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12h-72v24c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-24h-72c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h72v-24c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v24h72c6.6 0 12 5.4 12 12v40zm93-243L279 25c-9-9-23.7-9-32.7 0l-7 7c-1.5 1.5-2.2 3.5-2 5.6.1 1.5 .9 3 2.2 4.3l105 105c1.5 1.5 3.5 2.2 5.6 2 1.5-.1 3-.9 4.3-2.2l7-7c9-9.1 9-23.8 0-32.8zM384 128H256V0l128 128z"></path></svg>;
// --- END: SVG Icon Components ---
const API_URL = 'http://localhost:8000';
function WarningMessage({ message, onConfirm, onCancel }) {
  return (
    <div className="purchase-warning-message">
      <p>{message}</p>
      <div className="purchase-warning-buttons">
        <button onClick={onConfirm} className="purchase-confirm-button">Confirm</button>
        <button onClick={onCancel} className="purchase-cancel-button">Cancel</button>
      </div>
    </div>
  );
}
function Purchase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('item');
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseReceipts, setPurchaseReceipts] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [uomOptions, setUomOptions] = useState([]); // Now array of objects {_id, name}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showWarning, setShowWarning] = useState(null);
  const [warningAction, setWarningAction] = useState(null);
  const [editingPoId, setEditingPoId] = useState(null);
  const [editingPrId, setEditingPrId] = useState(null);
  const [editingPiId, setEditingPiId] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');
  const [poSelectedSupplier, setPoSelectedSupplier] = useState('');
  const [poSelectedItem, setPoSelectedItem] = useState('');
  const [prDateFrom, setPrDateFrom] = useState('');
  const [prDateTo, setPrDateTo] = useState('');
  const [prSelectedSupplier, setPrSelectedSupplier] = useState('');
  const [prSelectedItem, setPrSelectedItem] = useState('');
  const [piDateFrom, setPiDateFrom] = useState('');
  const [piDateTo, setPiDateTo] = useState('');
  const [piSelectedSupplier, setPiSelectedSupplier] = useState('');
  const [piSelectedItem, setPiSelectedItem] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [activeSection, setActiveSection] = useState('details');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [itemFormRows, setItemFormRows] = useState([
    { company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], isCompanyDropdownOpen: false }
  ]);
  const [uniqueCompanyNames, setUniqueCompanyNames] = useState([]);
  const [supplierForm, setSupplierForm] = useState({
    company: '',
    code: '',
    supplier_names: [],
    group: '',
    country: '',
    currency: '',
    taxId: '',
    taxCategory: '',
    taxWithholdingCategory: '',
    contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
    paymentMode: '',
    paymentTerms: '',
    creditLimit: 0,
    paymentTermsOverride: '',
    bankDetails: '',
    website: '',
    onTimeDelivery: 0,
    defectRate: 0,
    lastPurchaseDate: '',
    lastPurchaseValue: 0
  });
  const [poForm, setPoForm] = useState({
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: 'POS8',
    supplierId: '',
    name: '',
    supplierCompany: '',
    address: '',
    phone: '',
    email: '',
    currency: '',
    targetWarehouse: '',
    items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }],
    taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }],
    subtotal: 0,
    totalQuantity: 0,
    totalTaxes: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: ''
  });
  const [currentPoSupplier, setCurrentPoSupplier] = useState(null);
  const [prForm, setPrForm] = useState({
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: 'POS8',
    poId: '',
    supplierId: '',
    name: '',
    supplierCompany: '',
    address: '',
    phone: '',
    email: '',
    currency: '',
    items: [{ itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }],
    taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }],
    subtotal: 0,
    totalTaxes: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: ''
  });
  const [currentPrSupplier, setCurrentPrSupplier] = useState(null);
  const [piForm, setPiForm] = useState({
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: 'POS8',
    supplierId: '',
    name: '',
    supplierCompany: '',
    address: '',
    phone: '',
    email: '',
    poId: '',
    prId: '',
    currency: '',
    items: [{ itemId: '', acceptedQuantity: 0, rate: '', amount: 0, unit: '' }],
    taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }],
    totalQuantity: 0,
    subtotal: 0,
    taxesAdded: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: ''
  });
  const [currentPiSupplier, setCurrentPiSupplier] = useState(null);
  const [showPoFilters, setShowPoFilters] = useState(false);
  const [showPrFilters, setShowPrFilters] = useState(false);
  const [showPiFilters, setShowPiFilters] = useState(false);
  const [showPoDateFilter, setShowPoDateFilter] = useState(false);
  const [showPoSupplierFilter, setShowPoSupplierFilter] = useState(false);
  const [showPoItemFilter, setShowPoItemFilter] = useState(false);
  const [showPrDateFilter, setShowPrDateFilter] = useState(false);
  const [showPrSupplierFilter, setShowPrSupplierFilter] = useState(false);
  const [showPrItemFilter, setShowPrItemFilter] = useState(false);
  const [showPiDateFilter, setShowPiDateFilter] = useState(false);
  const [showPiSupplierFilter, setShowPiSupplierFilter] = useState(false);
  const [showPiItemFilter, setShowPiItemFilter] = useState(false);
  const paymentModeOptions = ['Bank Transfer', 'Cheque', 'Cash', 'Credit Card'];
  const paymentTermsOptions = ['Net 30', 'Net 60', 'Advance', 'COD'];
  const currencyOptions = ['USD', 'EUR', 'AED', 'INR'];
  const [showNewUomModal, setShowNewUomModal] = useState(false);
  const [newUomName, setNewUomName] = useState('');
  const [pendingUom, setPendingUom] = useState(null); // {index, field: 'masterUnit' or 'outerUnit'}
  const [creatingItemForPo, setCreatingItemForPo] = useState(null); // {rowIndex}
  const [creatingItemForPr, setCreatingItemForPr] = useState(null); // {rowIndex}
  const [creatingItemForPi, setCreatingItemForPi] = useState(null); // {rowIndex}
  const [creatingSupplierForPo, setCreatingSupplierForPo] = useState(false);
  const [creatingSupplierForPi, setCreatingSupplierForPi] = useState(false);
  const [editingFrom, setEditingFrom] = useState(null); // 'order', 'receipt', 'invoice'
  const [activeReport, setActiveReport] = useState('stock'); // For reports tab: 'stock', 'sales', 'po', 'pr', 'pi', 'supplier'
  const [reportPoSearch, setReportPoSearch] = useState('');
  const [reportPoDateFrom, setReportPoDateFrom] = useState('');
  const [reportPoDateTo, setReportPoDateTo] = useState('');
  const [reportPoSupplier, setReportPoSupplier] = useState('');
  const [reportPoStatus, setReportPoStatus] = useState('');
  const [reportPrSearch, setReportPrSearch] = useState('');
  const [reportPrDateFrom, setReportPrDateFrom] = useState('');
  const [reportPrDateTo, setReportPrDateTo] = useState('');
  const [reportPrSupplier, setReportPrSupplier] = useState('');
  const [reportPrStatus, setReportPrStatus] = useState('');
  const [reportPiSearch, setReportPiSearch] = useState('');
  const [reportPiDateFrom, setReportPiDateFrom] = useState('');
  const [reportPiDateTo, setReportPiDateTo] = useState('');
  const [reportPiSupplier, setReportPiSupplier] = useState('');
  const [reportPiStatus, setReportPiStatus] = useState('');
  const [reportSupplierSearch, setReportSupplierSearch] = useState('');
  const [reportSupplierGroup, setReportSupplierGroup] = useState('');
  const [reportSupplierCountry, setReportSupplierCountry] = useState('');
  const [showUomListModal, setShowUomListModal] = useState(false); // New state for UOM list modal
  const [saleQuantities, setSaleQuantities] = useState({});
  const [saleUoms, setSaleUoms] = useState({});
  const [supplierNames, setSupplierNames] = useState(['']); // For multiple supplier names
  const [editingUom, setEditingUom] = useState(null); // For editing UOM
  const [editingUomName, setEditingUomName] = useState(''); // Temp name for editing UOM
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [pendingCompany, setPendingCompany] = useState(null);
  useEffect(() => {
    fetchItems();
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchPurchaseReceipts();
    fetchPurchaseInvoices();
    fetchUoms();
  }, []);
  useEffect(() => {
    if (suppliers.length > 0) {
      const companies = [...new Set(suppliers.map(s => s.company).filter(Boolean))];
      setUniqueCompanyNames(companies);
    }
  }, [suppliers]);
  useEffect(() => {
    if (activeTab === 'order' && !editingPoId && !poForm.series) {
      setPoForm(prev => ({ ...prev, series: getNextSeries() }));
    }
  }, [activeTab, editingPoId, purchaseOrders]);
  useEffect(() => {
    if (activeTab === 'receipt' && !editingPrId && !prForm.series) {
      setPrForm(prev => ({ ...prev, series: getNextPrSeries() }));
    }
  }, [activeTab, editingPrId, purchaseReceipts]);
  useEffect(() => {
    if (activeTab === 'invoice' && !editingPiId && !piForm.series) {
      setPiForm(prev => ({ ...prev, series: getNextPiSeries() }));
    }
  }, [activeTab, editingPiId, purchaseInvoices]);
  useEffect(() => {
    if (editingItem) {
      setItemFormRows([{
        company: editingItem.company || '',
        name: editingItem.name,
        boxToMaster: editingItem.boxToMaster || '',
        masterUnit: editingItem.masterUnit,
        masterToOuter: editingItem.masterToOuter || '',
        outerUnit: editingItem.outerUnit || '',
        outerToNos: editingItem.outerToNos || '',
        nosUnit: editingItem.nosUnit,
        grams: editingItem.grams || '',
        suppliers: editingItem.suppliers || [], // Should now be an array of objects
        isCompanyDropdownOpen: false
      }]);
    } else {
      setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], isCompanyDropdownOpen: false }]);
    }
  }, [editingItem]);
  useEffect(() => {
    if (editingSupplier) {
      setSupplierForm({ ...editingSupplier, contacts: editingSupplier.contacts || [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }], supplier_names: editingSupplier.supplier_names || [] });
      setSupplierNames(editingSupplier.supplier_names || ['']);
    } else {
      setSupplierForm({
        company: '',
        code: '',
        supplier_names: [],
        group: '',
        country: '',
        currency: '',
        taxId: '',
        taxCategory: '',
        taxWithholdingCategory: '',
        contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
        paymentMode: '',
        paymentTerms: '',
        creditLimit: 0,
        paymentTermsOverride: '',
        bankDetails: '',
        website: '',
        onTimeDelivery: 0,
        defectRate: 0,
        lastPurchaseDate: '',
        lastPurchaseValue: 0
      });
      setSupplierNames(['']);
    }
  }, [editingSupplier]);
  useEffect(() => {
    if (suppliers.length > 0) {
      if (creatingSupplierForPo) {
        const newSupplier = suppliers[suppliers.length - 1];
        const contact = newSupplier.contacts[0] || { address: '', phone: '', email: '' };
        setPoForm(prev => ({
          ...prev,
          supplierId: newSupplier._id,
          name: newSupplier.supplier_names[0] || newSupplier.company,
          supplierCompany: newSupplier.company,
          address: contact.address,
          phone: contact.phone,
          email: contact.email,
          currency: newSupplier.currency || prev.currency
        }));
        setCurrentPoSupplier(newSupplier);
        setActiveTab('order');
        setCreatingSupplierForPo(false);
      } else if (creatingSupplierForPi) {
        const newSupplier = suppliers[suppliers.length - 1];
        const contact = newSupplier.contacts[0] || { address: '', phone: '', email: '' };
        setPiForm(prev => ({
          ...prev,
          supplierId: newSupplier._id,
          name: newSupplier.supplier_names[0] || newSupplier.company,
          supplierCompany: newSupplier.company,
          address: contact.address,
          phone: contact.phone,
          email: contact.email
        }));
        setCurrentPiSupplier(newSupplier);
        setActiveTab('invoice');
        setCreatingSupplierForPi(false);
      }
    }
  }, [suppliers]);
  const fetchUoms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/uoms`);
      if (response.ok) {
        const uoms = await response.json();
        setUomOptions(uoms); // Now full objects
      } else {
        setError('Failed to fetch UOMs');
      }
    } catch (err) {
      setError('Failed to fetch UOMs');
    }
  };
  const getNextSeries = () => {
    const prefix = 'PO';
    const matchingPos = purchaseOrders.filter(po => po.series && po.series.startsWith(prefix));
    if (matchingPos.length === 0) return prefix + '0001';
    const numbers = matchingPos.map(po => parseInt(po.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const getNextPrSeries = () => {
    const prefix = 'PR';
    const matchingPrs = purchaseReceipts.filter(pr => pr.series && pr.series.startsWith(prefix));
    if (matchingPrs.length === 0) return prefix + '0001';
    const numbers = matchingPrs.map(pr => parseInt(pr.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const getNextPiSeries = () => {
    const prefix = 'PI';
    const matchingPis = purchaseInvoices.filter(pi => pi.series && pi.series.startsWith(prefix));
    if (matchingPis.length === 0) return prefix + '0001';
    const numbers = matchingPis.map(pi => parseInt(pi.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data); // Now full objects
        return data;
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      setError('Failed to fetch items');
    }
    return null;
  };
  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/suppliers`);
      if (response.ok) {
        setSuppliers(await response.json());
      } else {
        setError('Failed to fetch suppliers');
      }
    } catch (err) {
      setError('Failed to fetch suppliers');
    }
  };
  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_orders`);
      if (response.ok) {
        setPurchaseOrders(await response.json());
      } else {
        setError('Failed to fetch purchase orders');
      }
    } catch (err) {
      setError('Failed to fetch purchase orders');
    }
  };
  const fetchPurchaseReceipts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_receipts`);
      if (response.ok) {
        setPurchaseReceipts(await response.json());
      } else {
        setError('Failed to fetch purchase receipts');
      }
    } catch (err) {
      setError('Failed to fetch purchase receipts');
    }
  };
  const fetchPurchaseInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_invoices`);
      if (response.ok) {
        setPurchaseInvoices(await response.json());
      } else {
        setError('Failed to fetch purchase invoices');
      }
    } catch (err) {
      setError('Failed to fetch purchase invoices');
    }
  };
  const handleItemFormChange = (index, field, value) => {
    if (['masterUnit', 'outerUnit'].includes(field) && value === 'create_new') {
      setPendingUom({ index, field });
      setShowNewUomModal(true);
      return;
    }
    if (field === 'company' && value === 'create_new') {
      setPendingCompany(index);
      setShowNewCompanyModal(true);
      return;
    }
    const updatedRows = [...itemFormRows];
    updatedRows[index][field] = value;
    setItemFormRows(updatedRows);
  };
  const handleCreateNewUom = async () => {
    if (newUomName.trim()) {
      try {
        const response = await fetch(`${API_URL}/api/uoms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newUomName.trim() })
        });
        if (response.ok) {
          const newUom = await response.json();
          const newUomOptions = [...uomOptions, newUom];
          setUomOptions(newUomOptions);
          handleItemFormChange(pendingUom.index, pendingUom.field, newUom.name);
          setNewUomName('');
          setShowNewUomModal(false);
          setPendingUom(null);
        } else {
          setError('Failed to create new UOM');
        }
      } catch (err) {
        setError('Failed to create new UOM');
      }
    }
  };
  const handleCreateNewCompany = () => {
    if (newCompanyName.trim()) {
      handleItemFormChange(pendingCompany, 'company', newCompanyName.trim());
      if (!uniqueCompanyNames.includes(newCompanyName.trim())) {
        setUniqueCompanyNames([...uniqueCompanyNames, newCompanyName.trim()]);
      }
      setNewCompanyName('');
      setShowNewCompanyModal(false);
      setPendingCompany(null);
    }
  };
  const addItemFormRow = () => {
    setItemFormRows([...itemFormRows, { company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], isCompanyDropdownOpen: false }]);
  };
  const removeItemFormRow = (index) => {
    if (itemFormRows.length > 1) {
      setItemFormRows(itemFormRows.filter((_, i) => i !== index));
    }
  };
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    for (const row of itemFormRows) {
      // Validation checks...
      if (!row.company || !row.name || !row.masterUnit || !row.outerUnit || !row.nosUnit || !row.boxToMaster || !row.masterToOuter || !row.outerToNos) {
        setError('All item fields with * are required and must be positive numbers where applicable.');
        setLoading(false);
        return;
      }
      const conversionFactor = Number(row.masterToOuter) * Number(row.outerToNos);
      const newItem = {
        company: row.company,
        name: row.name,
        boxToMaster: Number(row.boxToMaster),
        masterUnit: row.masterUnit,
        outerUnit: row.outerUnit,
        nosUnit: row.nosUnit,
        masterToOuter: Number(row.masterToOuter),
        outerToNos: Number(row.outerToNos),
        conversionFactor,
        stockMaster: 0,
        stockOuter: 0,
        stockNos: 0,
        soldNos: 0,
        totalStock: 0,
        totalPurchased: 0,
        grams: Number(row.grams) || 0,
        suppliers: row.suppliers || [] // This will be the array of {supplierId, supplierName}
      };
      try {
        const response = await fetch(`${API_URL}/api/purchase_items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (!response.ok) {
          const errData = await response.json();
          setError(errData.error || 'Failed to add item');
          setLoading(false);
          return;
        }
      } catch (err) {
        setError('Failed to add item');
        setLoading(false);
        return;
      }
    }
    const newItemsList = await fetchItems();
    setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], isCompanyDropdownOpen: false }]);
    setMessage('Item(s) added successfully');
    if (creatingItemForPo && itemFormRows.length === 1 && newItemsList) {
      const newItem = newItemsList.find(item => item.name === itemFormRows[0].name && item.company === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
      setPoForm(prev => {
        const updatedItems = [...prev.items];
        updatedItems[creatingItemForPo.rowIndex].itemId = newItem._id;
        const newForm = { ...prev, items: updatedItems };
        return { ...newForm, ...calculatePoTotals(newForm) };
      });
      setActiveTab('order');
      setCreatingItemForPo(null);
    } else if (creatingItemForPr && itemFormRows.length === 1 && newItemsList) {
        const newItem = newItemsList.find(item => item.name === itemFormRows[0].name && item.company === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
        setPrForm(prev => {
            const updatedItems = [...prev.items];
            updatedItems[creatingItemForPr.rowIndex].itemId = newItem._id;
            const newForm = { ...prev, items: updatedItems };
            return { ...newForm, ...calculatePrTotals(newForm) };
        });
        setActiveTab('receipt');
        setCreatingItemForPr(null);
    } else if (creatingItemForPi && itemFormRows.length === 1 && newItemsList) {
        const newItem = newItemsList.find(item => item.name === itemFormRows[0].name && item.company === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
        setPiForm(prev => {
            const updatedItems = [...prev.items];
            updatedItems[creatingItemForPi.rowIndex].itemId = newItem._id;
            const newForm = { ...prev, items: updatedItems };
            return { ...newForm, ...calculatePiTotals(newForm) };
        });
        setActiveTab('invoice');
        setCreatingItemForPi(null);
    }
    setLoading(false);
  };
  const handleItemUpdate = async (e) => {
    e.preventDefault();
    const row = itemFormRows[0];
    setLoading(true);
    setMessage('');
    setError(null);
     // Validation checks...
     if (!row.company || !row.name || !row.masterUnit || !row.outerUnit || !row.nosUnit || !row.boxToMaster || !row.masterToOuter || !row.outerToNos) {
      setError('All item fields with * are required and must be positive numbers where applicable.');
      setLoading(false);
      return;
    }
    const conversionFactor = Number(row.masterToOuter) * Number(row.outerToNos);
    const updatedItem = {
      company: row.company,
      name: row.name,
      boxToMaster: Number(row.boxToMaster),
      masterUnit: row.masterUnit,
      outerUnit: row.outerUnit,
      nosUnit: row.nosUnit,
      masterToOuter: Number(row.masterToOuter),
      outerToNos: Number(row.outerToNos),
      conversionFactor,
      grams: Number(row.grams) || 0,
      suppliers: row.suppliers || []
    };
    try {
      const response = await fetch(`${API_URL}/api/purchase_items/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (response.ok) {
        await fetchItems();
        setMessage('Item updated successfully');
        setEditingItem(null);
        setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], isCompanyDropdownOpen: false }]);
        if (editingFrom) {
            setActiveTab(editingFrom);
            setEditingFrom(null);
        }
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update item');
      }
    } catch (err) {
      setError('Failed to update item');
    }
    setLoading(false);
  };
  const deleteItem = (id) => {
    setShowWarning('Are you sure you want to delete this item?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/purchase_items/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchItems();
          setMessage('Item deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete item');
        }
      } catch (err) {
        setError('Failed to delete item');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const handleEditUom = (uom) => {
    setEditingUom(uom._id);
    setEditingUomName(uom.name);
  };
  const handleUpdateUom = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/uoms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingUomName })
      });
      if (response.ok) {
        await fetchUoms();
        setMessage('UOM updated successfully');
        setEditingUom(null);
        setEditingUomName('');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update UOM');
      }
    } catch (err) {
      setError('Failed to update UOM');
    }
  };
  const deleteUom = async (id) => {
    setShowWarning('Are you sure you want to delete this UOM?');
    setWarningAction(() => async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/uoms/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchUoms();
                setMessage('UOM deleted successfully');
            } else {
                const errData = await response.json();
                setError(errData.error || 'Failed to delete UOM');
            }
        } catch (err) {
            setError('Failed to delete UOM');
        }
        setLoading(false);
        setShowWarning(null);
        setWarningAction(null);
    });
};
  const addContact = () => {
    setSupplierForm({ ...supplierForm, contacts: [...supplierForm.contacts, { contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }] });
  };
  const removeContact = (index) => {
    if (supplierForm.contacts.length > 1) {
      const newContacts = supplierForm.contacts.filter((_, i) => i !== index);
      setSupplierForm({ ...supplierForm, contacts: newContacts });
    }
  };
  const handleContactChange = (index, field, value) => {
    const newContacts = [...supplierForm.contacts];
    newContacts[index][field] = value;
    setSupplierForm({ ...supplierForm, contacts: newContacts });
  };
  const addSupplierName = () => {
    setSupplierNames([...supplierNames, '']);
    setSupplierForm({ ...supplierForm, supplier_names: [...supplierForm.supplier_names, ''] });
  };
  const removeSupplierName = (index) => {
    if (supplierNames.length > 1) {
        const newNames = supplierNames.filter((_, i) => i !== index);
        setSupplierNames(newNames);
        setSupplierForm({ ...supplierForm, supplier_names: newNames });
    }
  };
  const handleSupplierNameChange = (index, value) => {
    const newNames = [...supplierNames];
    newNames[index] = value;
    setSupplierNames(newNames);
    setSupplierForm({ ...supplierForm, supplier_names: newNames });
  };
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm(supplierForm, 'supplier');
    if (validationError) {
        setError(validationError);
        return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      if (response.ok) {
        await fetchSuppliers();
        setSupplierForm({
          company: '', code: '', supplier_names: [], group: '', country: '', currency: '',
          taxId: '', taxCategory: '', taxWithholdingCategory: '',
          contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
          paymentMode: '', paymentTerms: '', creditLimit: 0, paymentTermsOverride: '',
          bankDetails: '', website: '', onTimeDelivery: 0, defectRate: 0,
          lastPurchaseDate: '', lastPurchaseValue: 0
        });
        setSupplierNames(['']);
        setMessage('Supplier saved successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save supplier');
      }
    } catch (err) {
      setError('Failed to save supplier');
    }
    setLoading(false);
  };
  const handleSupplierUpdate = async (e) => {
    e.preventDefault();
    const validationError = validateForm(supplierForm, 'supplier');
    if (validationError) {
        setError(validationError);
        return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/suppliers/${editingSupplier._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      if (response.ok) {
        await fetchSuppliers();
        setEditingSupplier(null);
        setSupplierForm({
            company: '', code: '', supplier_names: [], group: '', country: '', currency: '',
            taxId: '', taxCategory: '', taxWithholdingCategory: '',
            contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
            paymentMode: '', paymentTerms: '', creditLimit: 0, paymentTermsOverride: '',
            bankDetails: '', website: '', onTimeDelivery: 0, defectRate: 0,
            lastPurchaseDate: '', lastPurchaseValue: 0
        });
        setSupplierNames(['']);
        setMessage('Supplier updated successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update supplier');
      }
    } catch (err) {
      setError('Failed to update supplier');
    }
    setLoading(false);
  };
  const deleteSupplier = (id) => {
    setShowWarning('Are you sure you want to delete this supplier?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/suppliers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchSuppliers();
          setMessage('Supplier deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete supplier');
        }
      } catch (err) {
        setError('Failed to delete supplier');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const calculatePoTotals = (form) => {
    let subtotal = 0;
    let totalQuantity = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
    const newItems = form.items.map(item => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      totalQuantity += qty;
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].uom;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.uom === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
          // Check if all display UOM are same, assuming units are consistent across items
        } else {
          // Convert to master
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = Number(it.quantity || 0);
              if (it.uom === 'master') {
                totalQtyInCommon += qty;
              } else if (it.uom === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.uom === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.uom === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
    let totalTaxes = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (subtotal * Number(tax.taxRate || 0)) / 100;
      totalTaxes += amount;
      return { ...tax, amount, total: subtotal + totalTaxes };
    });
    const grandTotal = subtotal + totalTaxes;
    return { items: newItems, taxes: newTaxes, subtotal, totalQuantity, totalTaxes, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePoFormChange = (field, value) => {
    setPoForm(prev => {
        const newForm = { ...prev, [field]: value };
        return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const handlePoItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
        setCreatingItemForPo({ rowIndex: index });
        setActiveTab('item');
        return;
    }
    setPoForm(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const addPoItem = () => {
    setPoForm(prev => {
        const newItems = [...prev.items, { itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }];
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const removePoItem = (index) => {
    if (poForm.items.length > 1) {
        setPoForm(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            const newForm = { ...prev, items: newItems };
            return { ...newForm, ...calculatePoTotals(newForm) };
        });
    }
  };
  const handlePoTaxChange = (index, field, value) => {
    setPoForm(prev => {
        const newTaxes = [...prev.taxes];
        newTaxes[index][field] = value;
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const addPoTax = () => {
    setPoForm(prev => {
        const newTaxes = [...prev.taxes, { type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }];
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const removePoTax = (index) => {
    if (poForm.taxes.length > 1) {
        setPoForm(prev => {
            const newTaxes = prev.taxes.filter((_, i) => i !== index);
            const newForm = { ...prev, taxes: newTaxes };
            return { ...newForm, ...calculatePoTotals(newForm) };
        });
    }
  };
  const calculatePrTotals = (form) => {
    let subtotal = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
    const newItems = form.items.map(item => {
      const qty = Number(item.acceptedQuantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].unit;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.unit === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + Number(it.acceptedQuantity || 0), 0);
        } else {
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = Number(it.acceptedQuantity || 0);
              if (it.unit === 'master') {
                totalQtyInCommon += qty;
              } else if (it.unit === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.unit === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.unit === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
    let totalTaxes = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (subtotal * Number(tax.taxRate || 0)) / 100;
      totalTaxes += amount;
      return { ...tax, amount, total: subtotal + totalTaxes };
    });
    const grandTotal = subtotal + totalTaxes;
    return { items: newItems, taxes: newTaxes, subtotal, totalTaxes, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePrFormChange = (field, value) => {
    setPrForm(prev => {
        const newForm = { ...prev, [field]: value };
        return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const handlePrItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
        setCreatingItemForPr({ rowIndex: index });
        setActiveTab('item');
        return;
    }
    setPrForm(prev => {
      const newItems = [...prev.items];
      if (field === 'acceptedQuantity' || field === 'rejectedQuantity') {
        const original = newItems[index].originalQuantity || 0;
        let newAccepted = field === 'acceptedQuantity' ? Number(value) : newItems[index].acceptedQuantity;
        let newRejected = field === 'rejectedQuantity' ? Number(value) : newItems[index].rejectedQuantity;
        if (field === 'acceptedQuantity') {
            newRejected = original - newAccepted;
        } else {
            newAccepted = original - newRejected;
        }
        newItems[index].acceptedQuantity = Math.max(0, newAccepted);
        newItems[index].rejectedQuantity = Math.max(0, newRejected);
      } else {
        newItems[index][field] = value;
      }
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const addPrItem = () => {
    setPrForm(prev => {
        const newItems = [...prev.items, { itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }];
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const removePrItem = (index) => {
    if (prForm.items.length > 1) {
        setPrForm(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            const newForm = { ...prev, items: newItems };
            return { ...newForm, ...calculatePrTotals(newForm) };
        });
    }
  };
  const handlePrTaxChange = (index, field, value) => {
    setPrForm(prev => {
        const newTaxes = [...prev.taxes];
        newTaxes[index][field] = value;
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const addPrTax = () => {
    setPrForm(prev => {
        const newTaxes = [...prev.taxes, { type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }];
        const newForm = { ...prev, taxes: newTaxes};
        return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const removePrTax = (index) => {
    if (prForm.taxes.length > 1) {
        setPrForm(prev => {
            const newTaxes = prev.taxes.filter((_, i) => i !== index);
            const newForm = { ...prev, taxes: newTaxes };
            return { ...newForm, ...calculatePrTotals(newForm) };
        });
    }
  };
  const calculatePiTotals = (form) => {
    let subtotal = 0;
    let totalQuantity = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
    const newItems = form.items.map(item => {
      const qty = Number(item.acceptedQuantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      totalQuantity += qty;
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].unit;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.unit === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + Number(it.acceptedQuantity || 0), 0);
        } else {
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = Number(it.acceptedQuantity || 0);
              if (it.unit === 'master') {
                totalQtyInCommon += qty;
              } else if (it.unit === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.unit === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.unit === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
    let taxesAdded = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (subtotal * Number(tax.taxRate || 0)) / 100;
      taxesAdded += amount;
      return { ...tax, amount, total: subtotal + taxesAdded };
    });
    const grandTotal = subtotal + taxesAdded;
    return { items: newItems, taxes: newTaxes, subtotal, totalQuantity, taxesAdded, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePiFormChange = (field, value) => {
    setPiForm(prev => {
        const newForm = { ...prev, [field]: value };
        return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const handlePiItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
        setCreatingItemForPi({ rowIndex: index });
        setActiveTab('item');
        return;
    }
    setPiForm(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const addPiItem = () => {
    setPiForm(prev => {
        const newItems = [...prev.items, { itemId: '', acceptedQuantity: 0, rate: '', amount: 0, unit: '' }];
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const removePiItem = (index) => {
    if (piForm.items.length > 1) {
        setPiForm(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            const newForm = { ...prev, items: newItems };
            return { ...newForm, ...calculatePiTotals(newForm) };
        });
    }
  };
  const handlePiTaxChange = (index, field, value) => {
    setPiForm(prev => {
        const newTaxes = [...prev.taxes];
        newTaxes[index][field] = value;
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const addPiTax = () => {
    setPiForm(prev => {
        const newTaxes = [...prev.taxes, { type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }];
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const removePiTax = (index) => {
    if (piForm.taxes.length > 1) {
        setPiForm(prev => {
            const newTaxes = prev.taxes.filter((_, i) => i !== index);
            const newForm = { ...prev, taxes: newTaxes };
            return { ...newForm, ...calculatePiTotals(newForm) };
        });
    }
  };
  const validateForm = (form, type) => {
    if (type === 'supplier') {
        return null;
    } else if (type === 'po') {
        if (!form.series) return 'Series is required';
        if (!form.date) return 'Date is required';
        if (!form.company) return 'Company is required';
        if (!form.supplierId) return 'Supplier is required';
        if (!form.name) return 'Supplier name is required';
        for (const [index, item] of form.items.entries()) {
            if (!item.itemId) return `In item ${index + 1}: Item must be selected`;
            if (!item.quantity || Number(item.quantity) <= 0) return `In item ${index + 1}: Quantity must be positive`;
            if (item.rate && Number(item.rate) < 0) return `In item ${index + 1}: Rate cannot be negative`;
        }
        for (const [index, tax] of form.taxes.entries()) {
            if (!tax.type) return `In tax ${index + 1}: Type must be selected`;
            if (tax.taxRate === '' || Number(tax.taxRate) < 0) return `In tax ${index + 1}: Tax rate must be non-negative`;
        }
    } else if (type === 'pr') {
        if (!form.series) return 'Series is required';
        if (!form.date) return 'Date is required';
        if (!form.company) return 'Company is required';
        if (!form.poId) return 'Purchase Order is required';
        if (!form.name) return 'Supplier name is required';
        for (const [index, item] of form.items.entries()) {
            if (!item.itemId) return `In item ${index + 1}: Item must be selected`;
            if (item.acceptedQuantity === '' || Number(item.acceptedQuantity) < 0) return `In item ${index + 1}: Accepted Quantity must be non-negative`;
            if (item.rejectedQuantity === '' || Number(item.rejectedQuantity) < 0) return `In item ${index + 1}: Rejected Quantity must be non-negative`;
            if (item.rate && Number(item.rate) < 0) return `In item ${index + 1}: Rate cannot be negative`;
        }
        for (const [index, tax] of form.taxes.entries()) {
            if (!tax.type) return `In tax ${index + 1}: Type must be selected`;
            if (tax.taxRate === '' || Number(tax.taxRate) < 0) return `In tax ${index + 1}: Tax rate must be non-negative`;
        }
    } else if (type === 'pi') {
        if (!form.series) return 'Series is required';
        if (!form.date) return 'Date is required';
        if (!form.company) return 'Company is required';
        if (!form.prId) return 'Purchase Receipt is required';
        for (const [index, item] of form.items.entries()) {
            if (!item.itemId) return `In item ${index + 1}: Item must be selected`;
            if (!item.acceptedQuantity || Number(item.acceptedQuantity) <= 0) return `In item ${index + 1}: Accepted Quantity must be positive`;
            if (item.rate && Number(item.rate) < 0) return `In item ${index + 1}: Rate cannot be negative`;
        }
        for (const [index, tax] of form.taxes.entries()) {
            if (!tax.type) return `In tax ${index + 1}: Type must be selected`;
            if (tax.taxRate === '' || Number(tax.taxRate) < 0) return `In tax ${index + 1}: Tax rate must be non-negative`;
        }
    }
    return null;
  };
  const handlePoSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(poForm, 'po');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...poForm, status: 'Draft', targetWarehouse: 'Default' };
    try {
        let response;
        if (editingPoId) {
            response = await fetch(`${API_URL}/api/purchase_orders/${editingPoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseOrders();
            setEditingPoId(null);
            setPoForm({ series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8', supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }], taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalQuantity: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: '' });
            setCurrentPoSupplier(null);
            setMessage('Purchase Order draft saved');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to save purchase order');
        }
    } catch (err) {
        setError('Failed to save purchase order');
    }
    setLoading(false);
  };
  const handlePoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(poForm, 'po');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...poForm, status: 'Submitted', targetWarehouse: 'Default' };
    try {
        let response;
        if (editingPoId) {
            response = await fetch(`${API_URL}/api/purchase_orders/${editingPoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseOrders();
            setEditingPoId(null);
            setPoForm({ series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8', supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }], taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalQuantity: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: '' });
            setCurrentPoSupplier(null);
            setMessage('Purchase Order submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase order');
        }
    } catch (err) {
        setError('Failed to submit purchase order');
    }
    setLoading(false);
  };
  const submitPo = async (id) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
        const response = await fetch(`${API_URL}/api/purchase_orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Submitted' })
        });
        if (response.ok) {
            await fetchPurchaseOrders();
            setMessage('Purchase Order submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase order');
        }
    } catch (err) {
        setError('Failed to submit purchase order');
    }
    setLoading(false);
  };
  const editPo = (id) => {
    const po = purchaseOrders.find(p => p._id === id);
    if (po) {
        setPoForm({ ...po, date: po.date.slice(0, 10), grandTotal: po.grandTotal || po.subtotal });
        setCurrentPoSupplier(suppliers.find(s => s._id === po.supplierId));
        setEditingPoId(id);
        setActiveTab('order');
    }
  };
  const handlePrSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(prForm, 'pr');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...prForm, status: 'Draft' };
    try {
        let response;
        if (editingPrId) {
            response = await fetch(`${API_URL}/api/purchase_receipts/${editingPrId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_receipts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseReceipts();
            setEditingPrId(null);
            setPrForm({ series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8', poId: '', supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }], taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: '' });
            setCurrentPrSupplier(null);
            setMessage('Purchase Receipt draft saved');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to save purchase receipt');
        }
    } catch (err) {
        setError('Failed to save purchase receipt');
    }
    setLoading(false);
  };
  const handlePrSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(prForm, 'pr');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...prForm, status: 'Submitted' };
    try {
        let response;
        if (editingPrId) {
            response = await fetch(`${API_URL}/api/purchase_receipts/${editingPrId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_receipts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseReceipts();
            await fetchItems();
            setEditingPrId(null);
            setPrForm({ series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8', poId: '', supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }], taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: '' });
            setCurrentPrSupplier(null);
            setMessage('Purchase Receipt submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase receipt');
        }
    } catch (err) {
        setError('Failed to submit purchase receipt');
    }
    setLoading(false);
  };
  const submitPr = async (series) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
        const response = await fetch(`${API_URL}/api/purchase_receipts/${series}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Submitted' })
        });
        if (response.ok) {
            await fetchPurchaseReceipts();
            await fetchItems();
            setMessage('Purchase Receipt submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase receipt');
        }
    } catch (err) {
        setError('Failed to submit purchase receipt');
    }
    setLoading(false);
  };
  const editPr = (series) => {
    const pr = purchaseReceipts.find(p => p.series === series);
    if (pr) {
        setPrForm({
            ...pr,
            date: pr.date.slice(0, 10),
            items: pr.items.map(item => ({ ...item, originalQuantity: item.acceptedQuantity + item.rejectedQuantity }))
        });
        setCurrentPrSupplier(suppliers.find(s => s._id === pr.supplierId));
        setEditingPrId(pr.series);
        setActiveTab('receipt');
    }
  };
  const handlePiSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(piForm, 'pi');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...piForm, status: 'Draft' };
    try {
        let response;
        if (editingPiId) {
            response = await fetch(`${API_URL}/api/purchase_invoices/${editingPiId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseInvoices();
            setEditingPiId(null);
            setPiForm({
                series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8',
                supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '',
                poId: '', prId: '', currency: '',
                items: [{ itemId: '', acceptedQuantity: 0, rate: '', amount: 0, unit: '' }],
                taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }],
                totalQuantity: 0, subtotal: 0, taxesAdded: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: ''
            });
            setCurrentPiSupplier(null);
            setMessage('Purchase Invoice draft saved');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to save purchase invoice');
        }
    } catch (err) {
        setError('Failed to save purchase invoice');
    }
    setLoading(false);
  };
  const handlePiSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(piForm, 'pi');
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }
    const formWithStatus = { ...piForm, status: 'Submitted' };
    try {
        let response;
        if (editingPiId) {
            response = await fetch(`${API_URL}/api/purchase_invoices/${editingPiId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        } else {
            response = await fetch(`${API_URL}/api/purchase_invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formWithStatus)
            });
        }
        if (response.ok) {
            await fetchPurchaseInvoices();
            await fetchSuppliers();
            setEditingPiId(null);
            setPiForm({
                series: '', date: new Date().toISOString().slice(0, 10), company: 'POS8',
                supplierId: '', name: '', supplierCompany: '', address: '', phone: '', email: '',
                poId: '', prId: '', currency: '',
                items: [{ itemId: '', acceptedQuantity: 0, rate: '', amount: 0, unit: '' }],
                taxes: [{ type: 'On Net Total', taxRate: 0, amount: 0, total: 0 }],
                totalQuantity: 0, subtotal: 0, taxesAdded: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: ''
            });
            setCurrentPiSupplier(null);
            setMessage('Purchase Invoice submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase invoice');
        }
    } catch (err) {
        setError('Failed to submit purchase invoice');
    }
    setLoading(false);
  };
  const submitPi = async (series) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
        const response = await fetch(`${API_URL}/api/purchase_invoices/${series}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Submitted' })
        });
        if (response.ok) {
            await fetchPurchaseInvoices();
            await fetchSuppliers();
            setMessage('Purchase Invoice submitted successfully');
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to submit purchase invoice');
        }
    } catch (err) {
        setError('Failed to submit purchase invoice');
    }
    setLoading(false);
  };
  const editPi = (series) => {
    const pi = purchaseInvoices.find(p => p.series === series);
    if (pi) {
        setPiForm({ ...pi, date: pi.date.slice(0, 10) });
        setCurrentPiSupplier(suppliers.find(s => s._id === pi.supplierId));
        setEditingPiId(series);
        setActiveTab('invoice');
    }
  };
  const deletePo = (id) => {
    setShowWarning('Are you sure you want to delete this purchase order?');
    setWarningAction(() => async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchase_orders/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchPurchaseOrders();
                setMessage('Purchase Order deleted successfully');
            } else {
                const errData = await response.json();
                setError(errData.error || 'Failed to delete purchase order');
            }
        } catch (err) {
            setError('Failed to delete purchase order');
        }
        setLoading(false);
        setShowWarning(null);
        setWarningAction(null);
    });
  };
  const deletePr = (series) => {
    setShowWarning('Are you sure you want to delete this purchase receipt?');
    setWarningAction(() => async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchase_receipts/${series}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchPurchaseReceipts();
                await fetchItems();
                setMessage('Purchase Receipt deleted successfully');
            } else {
                const errData = await response.json();
                setError(errData.error || 'Failed to delete purchase receipt');
            }
        } catch (err) {
            setError('Failed to delete purchase receipt');
        }
        setLoading(false);
        setShowWarning(null);
        setWarningAction(null);
    });
  };
  const deletePi = (series) => {
    setShowWarning('Are you sure you want to delete this purchase invoice?');
    setWarningAction(() => async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchase_invoices/${series}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchPurchaseInvoices();
                await fetchSuppliers();
                setMessage('Purchase Invoice deleted successfully');
            } else {
                const errData = await response.json();
                setError(errData.error || 'Failed to delete purchase invoice');
            }
        } catch (err) {
            setError('Failed to delete purchase invoice');
        }
        setLoading(false);
        setShowWarning(null);
        setWarningAction(null);
    });
  };
  const handlePrintRow = (type, data) => {
    let htmlContent;
    if (type === 'po') htmlContent = generatePoHtml(data);
    else if (type === 'pr') htmlContent = generatePrHtml(data);
    else if (type === 'pi') htmlContent = generatePiHtml(data);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };
  const handlePrintTable = (type) => {
    let data;
    let title;
    let headers = [];
    let rows = [];
    let currency = 'USD'; // Default
    if (type === 'po') {
      data = filteredPurchaseOrdersReport;
      title = 'Purchase Orders Report';
      headers = ['PO Number', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Status'];
      rows = data.map(po => [
        po.series,
        new Date(po.date).toLocaleDateString(),
        po.name,
        po.items.map(item => renderItemQuantity(item, 'po')).join(', '),
        `${po.currency} ${(po.grandTotal || 0).toFixed(2)}`,
        po.status
      ]);
      currency = data[0]?.currency || currency;
    } else if (type === 'pr') {
      data = filteredPurchaseReceiptsReport;
      title = 'Purchase Receipts Report';
      headers = ['PR Number', 'PO Reference', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Status'];
      rows = data.map(pr => [
        pr.series,
        pr.poId,
        new Date(pr.date).toLocaleDateString(),
        pr.name,
        pr.items.map(item => renderItemQuantity(item, 'pr')).join(', '),
        `${pr.currency} ${(pr.grandTotal || 0).toFixed(2)}`,
        pr.status
      ]);
      currency = data[0]?.currency || currency;
    } else if (type === 'pi') {
      data = filteredPurchaseInvoicesReport;
      title = 'Purchase Invoices Report';
      headers = ['PI Number', 'Date', 'Supplier Name', 'PO Reference', 'PR Reference', 'Total Amount', 'Status'];
      rows = data.map(pi => [
        pi.series,
        new Date(pi.date).toLocaleDateString(),
        pi.name,
        pi.poId,
        pi.prId,
        `${pi.currency} ${(pi.grandTotal || 0).toFixed(2)}`,
        pi.status
      ]);
      currency = data[0]?.currency || currency;
    } else if (type === 'supplier') {
        data = filteredSuppliersReport;
        title = 'Suppliers Report';
        headers = ['Code', 'Company Name', 'Supplier Names', 'Group', 'Country', 'Currency', 'Tax ID', 'Contacts', 'Last Purchase Date'];
        rows = data.map(s => [
            s.code,
            s.company,
            (s.supplier_names || []).join(', '),
            s.group,
            s.country,
            s.currency,
            s.taxId,
            Array.isArray(s.contacts) ? s.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : '',
            s.lastPurchaseDate ? new Date(s.lastPurchaseDate).toLocaleDateString() : '-'
        ]);
    }
    const htmlContent = generateReportHtml(title, headers, rows, currency, type);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };
  const generateReportHtml = (title, headers, rows, currency, type) => {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    let totalRow = '';
    if (type !== 'supplier') {
        const totalAmountIndex = headers.indexOf('Total Amount');
        if (totalAmountIndex !== -1) {
            const grandTotal = rows.reduce((sum, row) => {
                const amountString = row[totalAmountIndex] || '';
                const numericString = amountString.replace(/[^0-9.-]+/g,"");
                const numericValue = parseFloat(numericString);
                return sum + (isNaN(numericValue) ? 0 : numericValue);
            }, 0);
            totalRow = `
                <tfoot>
                    <tr>
                        <td colspan="${totalAmountIndex}" style="text-align: right; font-weight: bold;">Grand Total</td>
                        <td style="font-weight: bold;">${currency} ${grandTotal.toFixed(2)}</td>
                        <td colspan="${headers.length - totalAmountIndex - 1}"></td>
                    </tr>
                </tfoot>
            `;
        }
    } else {
        totalRow = '<tfoot></tfoot>';
    }
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tfoot tr td { border: none; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <table>
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${bodyRows}</tbody>
                ${totalRow}
            </table>
        </body>
        </html>
    `;
  };
  const handleExportCSV = (type) => {
    let data;
    let filename;
    let headers = [];
    if (type === 'po') {
      data = filteredPurchaseOrdersReport;
      filename = 'purchase_orders.csv';
      headers = ['PO Number', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Status'];
      data = data.map(po => [
        po.series,
        new Date(po.date).toLocaleDateString(),
        po.name,
        po.items.map(item => renderItemQuantity(item, 'po')).join('; '),
        `${po.currency} ${(po.grandTotal || 0).toFixed(2)}`,
        po.status
      ]);
    } else if (type === 'pr') {
      data = filteredPurchaseReceiptsReport;
      filename = 'purchase_receipts.csv';
      headers = ['PR Number', 'PO Reference', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Status'];
      data = data.map(pr => [
        pr.series,
        pr.poId,
        new Date(pr.date).toLocaleDateString(),
        pr.name,
        pr.items.map(item => renderItemQuantity(item, 'pr')).join('; '),
        `${pr.currency} ${(pr.grandTotal || 0).toFixed(2)}`,
        pr.status
      ]);
    } else if (type === 'pi') {
      data = filteredPurchaseInvoicesReport;
      filename = 'purchase_invoices.csv';
      headers = ['PI Number', 'Date', 'Supplier Name', 'PO Reference', 'PR Reference', 'Total Amount', 'Status'];
      data = data.map(pi => [
        pi.series,
        new Date(pi.date).toLocaleDateString(),
        pi.name,
        pi.poId,
        pi.prId,
        `${pi.currency} ${(pi.grandTotal || 0).toFixed(2)}`,
        pi.status
      ]);
    } else if (type === 'supplier') {
        data = filteredSuppliersReport;
        filename = 'suppliers.csv';
        headers = ['Code', 'Company Name', 'Supplier Names', 'Group', 'Country', 'Currency', 'Tax ID', 'Contacts', 'Last Purchase Date'];
        data = data.map(s => [
            s.code,
            s.company,
            (s.supplier_names || []).join(', '),
            s.group,
            s.country,
            s.currency,
            s.taxId,
            Array.isArray(s.contacts) ? s.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : '',
            s.lastPurchaseDate ? new Date(s.lastPurchaseDate).toLocaleDateString() : '-'
        ]);
    }
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };
  // Helper function to convert number to words
  const toWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty ', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };
  const generatePoHtml = (po) => {
    const supplier = suppliers.find(s => s._id === po.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const itemRows = po.items.map((item, index) => {
        const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
        const amount = Number(item.quantity) * Number(item.rate);
        const taxRate = (po.taxes && po.taxes.length > 0) ? Number(po.taxes[0].taxRate || 0) : 0;
        const taxAmount = (amount * taxRate) / 100;
        const uomDisplay = item.uom === 'master' ? itemData.masterUnit : item.uom === 'outer' ? itemData.outerUnit : item.uom === 'nos' ? itemData.nosUnit : 'Grams';
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${itemData.name}</td>
                <td>${item.quantity}</td>
                <td>${uomDisplay}</td>
                <td>${po.currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${po.currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${po.currency} ${taxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = po.taxes.map(tax => {
        return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${po.currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Order ${po.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE ORDER</h1>
                <div class="header-right"><p>${po.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${po.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${po.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || po.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || po.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${po.date ? new Date(po.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${po.totalQuantity || 0}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${po.currency} ${(po.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${po.currency} ${(po.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${po.currency} ${toWords(Math.floor(po.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const generatePrHtml = (pr) => {
    const supplier = suppliers.find(s => s._id === pr.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const currency = pr.currency || 'INR'; // Default
    const taxRate = (pr.taxes && pr.taxes.length > 0) ? Number(pr.taxes[0].taxRate || 0) : 0;
    let totalAcceptedQuantity = 0;
    const itemRows = pr.items.map((item, index) => {
        const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
        const amount = Number(item.acceptedQuantity) * Number(item.rate);
        const itemTaxAmount = (amount * taxRate) / 100;
        totalAcceptedQuantity += Number(item.acceptedQuantity);
        const uomDisplay = item.unit === 'master' ? itemData.masterUnit : item.unit === 'outer' ? itemData.outerUnit : item.unit === 'nos' ? itemData.nosUnit : 'Grams';
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${itemData.name}</td>
                <td>${item.acceptedQuantity}</td>
                <td>${item.rejectedQuantity}</td>
                <td>${uomDisplay}</td>
                <td>${currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${currency} ${itemTaxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = pr.taxes.map(tax => {
        return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Receipt ${pr.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE RECEIPT</h1>
                <div class="header-right"><p>${pr.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${pr.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${pr.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || pr.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || pr.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${pr.date ? new Date(pr.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <p>PO Reference: ${pr.poId || 'Undefined'}</p>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Accepted Quantity</th><th>Rejected Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${totalAcceptedQuantity}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${currency} ${(pr.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${currency} ${(pr.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${currency} ${toWords(Math.floor(pr.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const generatePiHtml = (pi) => {
    const supplier = suppliers.find(s => s._id === pi.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const currency = pi.currency || 'INR';
    const taxRate = (pi.taxes && pi.taxes.length > 0) ? Number(pi.taxes[0].taxRate || 0) : 0;
    const itemRows = pi.items.map((item, index) => {
        const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
        const amount = Number(item.acceptedQuantity) * Number(item.rate);
        const itemTaxAmount = (amount * taxRate) / 100;
        const uomDisplay = item.unit === 'master' ? itemData.masterUnit : item.unit === 'outer' ? itemData.outerUnit : item.unit === 'nos' ? itemData.nosUnit : 'Grams';
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${itemData.name}</td>
                <td>${item.acceptedQuantity}</td>
                <td>${uomDisplay}</td>
                <td>${currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${currency} ${itemTaxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = pi.taxes.map(tax => {
        return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Invoice ${pi.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE INVOICE</h1>
                <div class="header-right"><p>${pi.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${pi.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${pi.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || pi.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || pi.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${pi.date ? new Date(pi.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <p>PO Reference: ${pi.poId || 'Undefined'}</p>
            <p>PR Reference: ${pi.prId || 'Undefined'}</p>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${pi.totalQuantity || 0}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${currency} ${(pi.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${currency} ${(pi.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${currency} ${toWords(Math.floor(pi.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const getSupplierDisplay = (supplierId, type = 'company') => {
    const supplier = suppliers.find(s => s._id === supplierId);
    if (!supplier) return 'N/A';
    if (type === 'names') {
        return (supplier.supplier_names && supplier.supplier_names.length > 0)
            ? supplier.supplier_names.join(', ')
            : supplier.company;
    }
    return supplier.company;
};
  const renderItemQuantity = (item, type) => {
    const itemData = items.find(i => i._id === item.itemId);
    if (!itemData) return 'Unknown Item';
    if (type === 'po') {
        return `${itemData.name}: ${item.quantity} ${item.uom}`;
    }
    // For PR and others
    return `${itemData.name}: Accepted ${item.acceptedQuantity || 0}, Rejected ${item.rejectedQuantity || 0}`;
};
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const filteredSuppliers = suppliers.filter(supplier =>
    supplierSearch ? (supplier.company.toLowerCase().includes(supplierSearch.toLowerCase()) || supplier.supplier_names.some(name => name.toLowerCase().includes(supplierSearch.toLowerCase()))) : true
  );
  const filteredPurchaseOrders = purchaseOrders.filter(order => {
    const dateCondition = (!poDateFrom || new Date(order.date) >= new Date(poDateFrom)) &&
                          (!poDateTo || new Date(order.date) <= new Date(poDateTo));
    const supplierCondition = !poSelectedSupplier || order.supplierId === poSelectedSupplier;
    const itemCondition = !poSelectedItem || order.items.some(item => item.itemId === poSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredPurchaseReceipts = purchaseReceipts.filter(receipt => {
    const dateCondition = (!prDateFrom || new Date(receipt.date) >= new Date(prDateFrom)) &&
                          (!prDateTo || new Date(receipt.date) <= new Date(prDateTo));
    const supplierCondition = !prSelectedSupplier || receipt.supplierId === prSelectedSupplier;
    const itemCondition = !prSelectedItem || receipt.items.some(item => item.itemId === prSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredPurchaseInvoices = purchaseInvoices.filter(invoice => {
    const dateCondition = (!piDateFrom || new Date(invoice.date) >= new Date(piDateFrom)) &&
                          (!piDateTo || new Date(invoice.date) <= new Date(piDateTo));
    const supplierCondition = !piSelectedSupplier || invoice.supplierId === piSelectedSupplier;
    const itemCondition = !piSelectedItem || invoice.items.some(item => item.itemId === piSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredReportItems = items.filter(item =>
    item.name.toLowerCase().includes(reportSearch.toLowerCase())
  );
  const filteredPurchaseOrdersReport = purchaseOrders.filter(order => {
    const dateCondition = (!reportPoDateFrom || new Date(order.date) >= new Date(reportPoDateFrom)) &&
                          (!reportPoDateTo || new Date(order.date) <= new Date(reportPoDateTo));
    const supplierCondition = !reportPoSupplier || order.supplierId === reportPoSupplier;
    const statusCondition = !reportPoStatus || order.status === reportPoStatus;
    const searchCondition = !reportPoSearch || order.series.toLowerCase().includes(reportPoSearch.toLowerCase());
    return dateCondition && supplierCondition && statusCondition && searchCondition;
  });
  const filteredPurchaseReceiptsReport = purchaseReceipts.filter(receipt => {
    const dateCondition = (!reportPrDateFrom || new Date(receipt.date) >= new Date(reportPrDateFrom)) &&
                          (!reportPrDateTo || new Date(receipt.date) <= new Date(reportPrDateTo));
    const supplierCondition = !reportPrSupplier || receipt.supplierId === reportPrSupplier;
    const statusCondition = !reportPrStatus || receipt.status === reportPrStatus;
    const searchCondition = !reportPrSearch || receipt.series.toLowerCase().includes(reportPrSearch.toLowerCase());
    return dateCondition && supplierCondition && statusCondition && searchCondition;
  });
  const filteredPurchaseInvoicesReport = purchaseInvoices.filter(invoice => {
    const dateCondition = (!reportPiDateFrom || new Date(invoice.date) >= new Date(reportPiDateFrom)) &&
                          (!reportPiDateTo || new Date(invoice.date) <= new Date(reportPiDateTo));
    const supplierCondition = !reportPiSupplier || invoice.supplierId === reportPiSupplier;
    const statusCondition = !reportPiStatus || invoice.status === reportPiStatus;
    const searchCondition = !reportPiSearch || invoice.series.toLowerCase().includes(reportPiSearch.toLowerCase());
    return dateCondition && supplierCondition && statusCondition && searchCondition;
  });
  const filteredSuppliersReport = suppliers.filter(supplier => {
    const groupCondition = !reportSupplierGroup || supplier.group.toLowerCase().includes(reportSupplierGroup.toLowerCase());
    const countryCondition = !reportSupplierCountry || supplier.country.toLowerCase().includes(reportSupplierCountry.toLowerCase());
    const searchCondition = !reportSupplierSearch || supplier.company.toLowerCase().includes(reportSupplierSearch.toLowerCase()) ||
                              (supplier.code && supplier.code.toLowerCase().includes(reportSupplierSearch.toLowerCase())) ||
                              supplier.supplier_names.some(name => name.toLowerCase().includes(reportSupplierSearch.toLowerCase()));
    return groupCondition && countryCondition && searchCondition;
  });
  const calculateGrandTotal = (data, field = 'grandTotal') => {
    return data.reduce((sum, item) => sum + (item[field] || 0), 0);
  };
  const tabs = [
    { key: 'item', name: 'Items', icon: <FaShoppingCart /> },
    { key: 'supplier', name: 'Suppliers', icon: <FaUser /> },
    { key: 'order', name: 'Purchase Order', icon: <FaShoppingCart /> },
    { key: 'receipt', name: 'Purchase Receipt', icon: <FaTruck /> },
    { key: 'invoice', name: 'Purchase Invoice', icon: <FaFileInvoice /> },
    { key: 'report', name: 'Reports', icon: <FaChartBar /> },
  ];
  const handleTopSave = (e) => {
    if (editingSupplier) {
        handleSupplierUpdate(e);
    } else {
        handleSupplierSubmit(e);
    }
  };
  const handleRecordSale = async (itemId) => {
    const rawQuantity = Number(saleQuantities[itemId]);
    const uom = saleUoms[itemId] || 'nos';
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    let quantity_in_nos = rawQuantity;
    if (uom === 'master') {
        quantity_in_nos *= item.masterToOuter * item.outerToNos;
    } else if (uom === 'outer') {
        quantity_in_nos *= item.outerToNos;
    }
    if (isNaN(quantity_in_nos) || quantity_in_nos <= 0) {
        setError('Valid quantity required for sale');
        return;
    }
    if (quantity_in_nos > item.totalStock) {
        setError('Insufficient stock');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/purchase_sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, quantity: quantity_in_nos })
        });
        if (response.ok) {
            await fetchItems();
            setMessage('Sale recorded successfully');
            setSaleQuantities({ ...saleQuantities, [itemId]: '' });
            setSaleUoms({ ...saleUoms, [itemId]: 'nos' });
        } else {
            const errData = await response.json();
            setError(errData.error || 'Failed to record sale');
        }
    } catch (err) {
        setError('Failed to record sale');
    }
  };
  return (
    <div className="purchase-container">
      <div className="purchase-sidebar">
        <h2>Purchase Module</h2>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`purchase-tab-button ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
      <div className="purchase-content">
        <button onClick={() => navigate('/admin')} className="purchase-back-button">
          <FaArrowLeft />
        </button>
        <div className="purchase-main-content">
          <h2>Purchase Module</h2>
          {loading && <p className="purchase-loading">Loading...</p>}
          {(error || message) && (
            <p className={`purchase-message ${error ? 'error' : 'success'}`}>
              {error || message}
            </p>
          )}
          {showWarning && (
            <WarningMessage
              message={showWarning}
              onConfirm={warningAction}
              onCancel={() => { setShowWarning(null); setWarningAction(null); }}
            />
          )}
          {showNewUomModal && (
            <div className="purchase-modal-overlay" onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); }}>
              <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                <button className="purchase-modal-close" onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); }}>
                    <FaTimes />
                </button>
                <h3>Create New UOM</h3>
                <input
                    type="text"
                    value={newUomName}
                    onChange={(e) => setNewUomName(e.target.value)}
                    placeholder="Enter new UOM name"
                    className="purchase-input"
                />
                <div className="purchase-form-buttons">
                    <button onClick={handleCreateNewUom} className="purchase-button submit">Create</button>
                    <button onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); }} className="purchase-button cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {showNewCompanyModal && (
            <div className="purchase-modal-overlay" onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); }}>
              <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                <button className="purchase-modal-close" onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); }}>
                    <FaTimes />
                </button>
                <h3>Create New Company</h3>
                <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter new company name"
                    className="purchase-input"
                />
                <div className="purchase-form-buttons">
                    <button onClick={handleCreateNewCompany} className="purchase-button submit">Create</button>
                    <button onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); }} className="purchase-button cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {showUomListModal && (
            <div className="purchase-modal-overlay" onClick={() => setShowUomListModal(false)}>
              <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                <button className="purchase-modal-close" onClick={() => setShowUomListModal(false)}>
                    <FaTimes />
                </button>
                <h3>UOM List</h3>
                <table className="purchase-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uomOptions.map(uom => (
                            <tr key={uom._id}>
                                <td>
                                    {editingUom === uom._id ? (
                                        <input
                                            type="text"
                                            value={editingUomName}
                                            onChange={(e) => setEditingUomName(e.target.value)}
                                            className="purchase-input"
                                        />
                                    ) : (
                                        uom.name
                                    )}
                                </td>
                                <td>
                                    {editingUom === uom._id ? (
                                        <>
                                            <button onClick={() => handleUpdateUom(uom._id)} className="purchase-button submit">
                                                <FaCheck /> Save
                                            </button>
                                            <button onClick={() => setEditingUom(null)} className="purchase-button cancel">
                                                <FaTimes /> Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEditUom(uom)} className="purchase-button edit">
                                                <FaEdit /> Edit
                                            </button>
                                            <button onClick={() => deleteUom(uom._id)} className="purchase-button delete">
                                                <FaTrash /> Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'item' && (
            <div className="purchase-section">
              <div className="purchase-header">
                <h3>Manage Items</h3>
                <div className="purchase-filter-group-center">
                  <input
                    type="text"
                    placeholder="Search items by name"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="purchase-input"
                  />
                </div>
                <div className="purchase-filter-group-right">
                   {editingItem && (
                    <button type="button" onClick={() => setEditingItem(null)} className="purchase-button cancel">
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={() => setShowUomListModal(true)} className="purchase-button filter">
                    View UOMs
                  </button>
                  <button type="button" onClick={editingItem ? handleItemUpdate : handleItemSubmit} className="purchase-button submit">
                    {editingItem ? 'Update Item' : 'Save Item(s)'}
                  </button>
                </div>
              </div>
              <div className="purchase-form">
                <table className="purchase-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">Company</th>
                            <th rowSpan="2">Item Name</th>
                            <th rowSpan="2">Grams</th>
                            <th colSpan="2">Carton</th>
                            <th colSpan="2">Packet</th>
                            <th colSpan="2">Patty</th>
                            <th rowSpan="2">Suppliers</th>
                            <th rowSpan="2">Actions</th>
                        </tr>
                        <tr>
                            <th>Nos</th><th>UOM</th>
                            <th>Nos</th><th>UOM</th>
                            <th>Nos</th><th>UOM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemFormRows.map((row, idx) => (
                            <tr key={idx}>
                                <td>
                                    <select 
                                        value={row.company} 
                                        onChange={(e) => handleItemFormChange(idx, 'company', e.target.value)} 
                                        className="purchase-input select" 
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {uniqueCompanyNames.map(name => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                        <option value="create_new">Create New Company</option>
                                    </select>
                                </td>
                                <td><input type="text" value={row.name} onChange={(e) => handleItemFormChange(idx, 'name', e.target.value)} placeholder="Item name" className="purchase-input" required/></td>
                                <td><input type="number" value={row.grams} onChange={(e) => handleItemFormChange(idx, 'grams', e.target.value)} placeholder="Grams" className="purchase-input"/></td>
                                <td><input type="number" value={row.boxToMaster} onChange={(e) => handleItemFormChange(idx, 'boxToMaster', e.target.value)} placeholder="Nos" className="purchase-input" required /></td>
                                <td>
                                    <select value={row.masterUnit} onChange={(e) => handleItemFormChange(idx, 'masterUnit', e.target.value)} className="purchase-input select" required>
                                        <option value="">Select UOM</option>
                                        {uomOptions.map(uom => (<option key={uom._id} value={uom.name}>{uom.name}</option>))}
                                        <option value="create_new">Create New UOM</option>
                                    </select>
                                </td>
                                <td><input type="number" value={row.masterToOuter} onChange={(e) => handleItemFormChange(idx, 'masterToOuter', e.target.value)} placeholder="Nos" className="purchase-input" required /></td>
                                <td>
                                    <select value={row.outerUnit} onChange={(e) => handleItemFormChange(idx, 'outerUnit', e.target.value)} className="purchase-input select" required>
                                        <option value="">Select UOM</option>
                                        {uomOptions.map(uom => (<option key={uom._id} value={uom.name}>{uom.name}</option>))}
                                        <option value="create_new">Create New UOM</option>
                                    </select>
                                </td>
                                <td><input type="number" value={row.outerToNos} onChange={(e) => handleItemFormChange(idx, 'outerToNos', e.target.value)} placeholder="Nos" className="purchase-input" required /></td>
                                <td><input type="text" value={row.nosUnit} onChange={(e) => handleItemFormChange(idx, 'nosUnit', e.target.value)} placeholder="Nos UOM (e.g., Patty)" className="purchase-input" required /></td>
                                <td>
                                    <select
                                      multiple
                                      value={row.suppliers.map(s => `${s.supplierId}|${s.supplierName}`)}
                                      onChange={(e) => {
                                        const selectedOptions = Array.from(e.target.selectedOptions);
                                        const newSuppliers = selectedOptions.map(option => {
                                          const [supplierId, supplierName] = option.value.split('|');
                                          return { supplierId, supplierName };
                                        });
                                        handleItemFormChange(idx, 'suppliers', newSuppliers);
                                      }}
                                      className="purchase-input select"
                                    >
                                      {suppliers
                                        .filter(s => s.company === row.company)
                                        .flatMap(supplier =>
                                          (supplier.supplier_names && supplier.supplier_names.length > 0)
                                            ? supplier.supplier_names.map(name => ({
                                                id: supplier._id,
                                                displayName: name
                                              }))
                                            : [{
                                                id: supplier._id,
                                                displayName: supplier.company
                                              }]
                                        )
                                        .map(option => (
                                          <option key={`${option.id}-${option.displayName}`} value={`${option.id}|${option.displayName}`}>
                                            {option.displayName}
                                          </option>
                                        ))
                                      }
                                    </select>
                                </td>
                                <td>
                                    {!editingItem && (
                                    <button type="button" onClick={() => removeItemFormRow(idx)} className="purchase-button delete" disabled={itemFormRows.length === 1}>
                                        <FaTrash />
                                    </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="purchase-form-buttons">
                    {!editingItem && (
                    <button type="button" onClick={addItemFormRow} className="purchase-button add-row">
                        <FaPlus /> Add Row
                    </button>
                    )}
                </div>
              </div>
              <h3>Items List</h3>
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Name</th>
                    <th>Grams</th>
                    <th>Cartons per Box</th>
                    <th>Packets per Carton</th>
                    <th>Patties per Packet</th>
                    <th>Sold Nos</th>
                    <th>Total Purchased</th>
                    <th>Total Stock</th>
                    <th>Suppliers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const remainingPatties = item.totalStock;
             
                    const supplierNamesList = (item.suppliers && Array.isArray(item.suppliers))
                        ? item.suppliers.map(s => s.supplierName).join(', ')
                        : 'N/A';
                    return (
                      <tr key={item._id}>
                        <td>{item.company}</td>
                        <td>{item.name}</td>
                        <td>{item.grams || '-'}</td>
                        <td>{item.boxToMaster} {item.masterUnit}</td>
                        <td>{item.masterToOuter} {item.outerUnit}</td>
                        <td>{item.outerToNos} {item.nosUnit}</td>
                        <td>{item.soldNos || 0} {item.nosUnit}</td>
                        <td>{item.totalPurchased || 0} {item.nosUnit}</td>
                        <td>{remainingPatties} {item.nosUnit}</td>
                        <td>{supplierNamesList}</td>
                        <td className="purchase-action-buttons">
                          <button onClick={() => setEditingItem(item)} className="purchase-button edit"><FaEdit /> Edit</button>
                          <button onClick={() => deleteItem(item._id)} className="purchase-button delete"><FaTrash /> Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'supplier' && (
            <div className="purchase-section">
                <div className="purchase-header">
                    <h3>Manage Suppliers</h3>
                    <div className="purchase-filter-group-center">
                        <input
                            type="text"
                            placeholder="Search suppliers by name or phone"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            className="purchase-input"
                        />
                    </div>
                    <div className="purchase-filter-group-right">
                        <button onClick={() => setShowSupplierModal(true)} className="purchase-button filter">
                            View Suppliers List
                        </button>
                        <button onClick={handleTopSave} className="purchase-button submit">
                            {editingSupplier ? 'Update Supplier' : 'Save'}
                        </button>
                        {editingSupplier && (
                            <button type="button" onClick={() => setEditingSupplier(null)} className="purchase-button cancel">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                <div className="purchase-form">
                    <div className="purchase-supplier-tabs">
                        <div className={`purchase-supplier-tab ${activeSection === 'details' ? 'active' : ''}`} onClick={() => setActiveSection('details')}>Details</div>
                        <div className={`purchase-supplier-tab ${activeSection === 'tax' ? 'active' : ''}`} onClick={() => setActiveSection('tax')}>Tax</div>
                        <div className={`purchase-supplier-tab ${activeSection === 'address_contact' ? 'active' : ''}`} onClick={() => setActiveSection('address_contact')}>Address & Contact</div>
                        <div className={`purchase-supplier-tab ${activeSection === 'accounting' ? 'active' : ''}`} onClick={() => setActiveSection('accounting')}>Accounting</div>
                        <div className={`purchase-supplier-tab ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>Settings</div>
                    </div>
                    {activeSection === 'details' && (
                        <div className="purchase-supplier-content">
                            <div className="purchase-form-field"><label className="purchase-label">Company Name / Trade Name</label><input type="text" value={supplierForm.company} onChange={(e) => setSupplierForm({ ...supplierForm, company: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Supplier Code / Short Name</label><input type="text" value={supplierForm.code} onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field">
                                <label className="purchase-label">Supplier Names</label>
                                {supplierNames.map((name, idx) => (
                                    <div key={idx} className="purchase-contact-block">
                                        <input type="text" value={name} onChange={(e) => handleSupplierNameChange(idx, e.target.value)} placeholder={`Supplier Name ${idx + 1}`} className="purchase-input"/>
                                        <button type="button" onClick={() => removeSupplierName(idx)} className="purchase-button delete" disabled={supplierNames.length === 1}>Remove Name</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addSupplierName} className="purchase-button add-row"><FaPlus /> Add Supplier Name</button>
                            </div>
                            <div className="purchase-form-field"><label className="purchase-label">Supplier group/Category</label><input type="text" value={supplierForm.group} onChange={(e) => setSupplierForm({ ...supplierForm, group: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Country</label><input type="text" value={supplierForm.country} onChange={(e) => setSupplierForm({ ...supplierForm, country: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field">
                                <label className="purchase-label">Default Currency</label>
                                <select value={supplierForm.currency} onChange={(e) => setSupplierForm({ ...supplierForm, currency: e.target.value })} className="purchase-input select">
                                    <option value="">Select Default Currency</option>
                                    {currencyOptions.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    {activeSection === 'tax' && (
                        <div className="purchase-supplier-content">
                            <div className="purchase-form-field"><label className="purchase-label">Tax ID / VAT / TRN</label><input type="text" value={supplierForm.taxId} onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Tax Category</label><input type="text" value={supplierForm.taxCategory} onChange={(e) => setSupplierForm({ ...supplierForm, taxCategory: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Tax Withholding Category</label><input type="text" value={supplierForm.taxWithholdingCategory} onChange={(e) => setSupplierForm({ ...supplierForm, taxWithholdingCategory: e.target.value })} className="purchase-input"/></div>
                        </div>
                    )}
                    {activeSection === 'address_contact' && (
                        <div className="purchase-supplier-content">
                            {supplierForm.contacts.map((contact, idx) => (
                                <div key={idx} className="purchase-contact-block">
                                    <div className="purchase-form-field"><label className="purchase-label">Contact Person {idx + 1}</label><input type="text" value={contact.contactPerson} onChange={(e) => handleContactChange(idx, 'contactPerson', e.target.value)} className="purchase-input"/></div>
                                    <div className="purchase-form-field"><label className="purchase-label">WhatsApp No. {idx + 1}</label><input type="tel" value={contact.whatsapp} onChange={(e) => handleContactChange(idx, 'whatsapp', e.target.value)} className="purchase-input"/></div>
                                    <div className="purchase-form-field"><label className="purchase-label">Phone {idx + 1}</label><input type="tel" value={contact.phone} onChange={(e) => handleContactChange(idx, 'phone', e.target.value)} className="purchase-input"/></div>
                                    <div className="purchase-form-field"><label className="purchase-label">Email {idx + 1}</label><input type="email" value={contact.email} onChange={(e) => handleContactChange(idx, 'email', e.target.value)} className="purchase-input"/></div>
                                    <div className="purchase-form-field">
                                        <label className="purchase-label">Address {idx + 1}</label><input type="text" value={contact.address} onChange={(e) => handleContactChange(idx, 'address', e.target.value)} className="purchase-input"/>
                                        <button type="button" onClick={() => removeContact(idx)} className="purchase-button delete" disabled={supplierForm.contacts.length === 1}>Remove Contact</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addContact} className="purchase-button add-row"><FaPlus /> Add Contact</button>
                        </div>
                    )}
                    {activeSection === 'accounting' && (
                        <div className="purchase-supplier-content">
                            <div className="purchase-form-field">
                                <label className="purchase-label">Preferred Payment Mode</label>
                                <select value={supplierForm.paymentMode} onChange={(e) => setSupplierForm({ ...supplierForm, paymentMode: e.target.value })} className="purchase-input select">
                                    <option value="">Select Preferred Payment Mode</option>
                                    {paymentModeOptions.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                            </div>
                            <div className="purchase-form-field">
                                <label className="purchase-label">Payment Terms</label>
                                <select value={supplierForm.paymentTerms} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })} className="purchase-input select">
                                    <option value="">Select Payment Terms</option>
                                    {paymentTermsOptions.map(term => <option key={term} value={term}>{term}</option>)}
                                </select>
                            </div>
                            <div className="purchase-form-field"><label className="purchase-label">Credit Limit</label><input type="number" value={supplierForm.creditLimit} onChange={(e) => setSupplierForm({ ...supplierForm, creditLimit: Number(e.target.value) })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Payment Terms Override</label><input type="text" value={supplierForm.paymentTermsOverride} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTermsOverride: e.target.value })} className="purchase-input"/></div>
                        </div>
                    )}
                    {activeSection === 'settings' && (
                        <div className="purchase-supplier-content">
                            <div className="purchase-form-field"><label className="purchase-label">Bank Details (Account No., IBAN, SWIFT)</label><textarea value={supplierForm.bankDetails} onChange={(e) => setSupplierForm({ ...supplierForm, bankDetails: e.target.value })} className="purchase-input textarea"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Website</label><input type="url" value={supplierForm.website} onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">On-Time Delivery %</label><input type="number" value={supplierForm.onTimeDelivery} onChange={(e) => setSupplierForm({ ...supplierForm, onTimeDelivery: Number(e.target.value) })} className="purchase-input" min="0" max="100"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Defect Rate %</label><input type="number" value={supplierForm.defectRate} onChange={(e) => setSupplierForm({ ...supplierForm, defectRate: Number(e.target.value) })} className="purchase-input" min="0" max="100"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Last Purchase Date</label><input type="date" value={supplierForm.lastPurchaseDate} onChange={(e) => setSupplierForm({ ...supplierForm, lastPurchaseDate: e.target.value })} className="purchase-input"/></div>
                            <div className="purchase-form-field"><label className="purchase-label">Last Purchase Value</label><input type="number" value={supplierForm.lastPurchaseValue} onChange={(e) => setSupplierForm({ ...supplierForm, lastPurchaseValue: Number(e.target.value) })} className="purchase-input"/></div>
                        </div>
                    )}
                </div>
                 {showSupplierModal && (
                    <div className="purchase-modal-overlay" onClick={() => setShowSupplierModal(false)}>
                        <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="purchase-modal-close" onClick={() => setShowSupplierModal(false)}><FaTimes /></button>
                            <h3>Suppliers List</h3>
                            <div className="purchase-table-wrapper">
                                <table className="purchase-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Company Name</th>
                                            <th>Supplier Names</th>
                                            <th>Group</th>
                                            <th>Country</th>
                                            <th>Currency</th>
                                            <th>Tax ID</th>
                                            <th>Contacts</th>
                                            <th>Last Purchase Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSuppliers.map(supplier => (
                                            <tr key={supplier._id}>
                                                <td>{supplier.code}</td>
                                                <td>{supplier.company}</td>
                                                <td>{(supplier.supplier_names || []).join(', ')}</td>
                                                <td>{supplier.group}</td>
                                                <td>{supplier.country}</td>
                                                <td>{supplier.currency}</td>
                                                <td>{supplier.taxId}</td>
                                                <td>{Array.isArray(supplier.contacts) ? supplier.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : ''}</td>
                                                <td>{supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                                                <td className="purchase-action-buttons">
                                                    <button onClick={() => {
                                                        setEditingSupplier(supplier);
                                                        setSupplierNames(supplier.supplier_names || ['']);
                                                        setShowSupplierModal(false);
                                                    }} className="purchase-button edit"><FaEdit /> Edit</button>
                                                    <button onClick={() => deleteSupplier(supplier._id)} className="purchase-button delete"><FaTrash /> Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
          )}
          {activeTab === 'order' && (
              <div className="purchase-section">
               <div className="purchase-header">
                  <h3>Purchase Order</h3>
                  <div className="purchase-filter-group-center">
                    <FaFilter className="purchase-icon" onClick={() => setShowPoFilters(!showPoFilters)} />
                    {showPoFilters && (
                      <div className="purchase-filter-dropdown">
                        <button onClick={() => setShowPoDateFilter(!showPoDateFilter)} className="purchase-button filter-option">
                          {showPoDateFilter ? 'Hide' : 'Show'} Date Filter
                        </button>
                        <button onClick={() => setShowPoSupplierFilter(!showPoSupplierFilter)} className="purchase-button filter-option">
                          {showPoSupplierFilter ? 'Hide' : 'Show'} Supplier Filter
                        </button>
                        <button onClick={() => setShowPoItemFilter(!showPoItemFilter)} className="purchase-button filter-option">
                          {showPoItemFilter ? 'Hide' : 'Show'} Item Filter
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="purchase-active-filters">
                    {showPoDateFilter && (
                      <>
                        <label>From: <input type="date" value={poDateFrom} onChange={(e) => setPoDateFrom(e.target.value)} className="purchase-input" /></label>
                        <label>To: <input type="date" value={poDateTo} onChange={(e) => setPoDateTo(e.target.value)} className="purchase-input" /></label>
                      </>
                    )}
                    {showPoSupplierFilter && (
                      <select
                        value={poSelectedSupplier}
                        onChange={(e) => setPoSelectedSupplier(e.target.value)}
                        className="purchase-input select"
                      >
                        <option value="">All Suppliers</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{`${s.code} - ${s.company}`}</option>)}
                      </select>
                    )}
                    {showPoItemFilter && (
                      <select
                        value={poSelectedItem}
                        onChange={(e) => setPoSelectedItem(e.target.value)}
                        className="purchase-input select"
                      >
                        <option value="">All Items</option>
                        {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="purchase-filter-group-right">
                    <button type="button" onClick={handlePoSave} className="purchase-button save">Save</button>
                    <button type="button" onClick={handlePoSubmit} className="purchase-button submit">Submit</button>
                  </div>
                </div>
               <div className="purchase-main">
                  <div className="purchase-form-grid">
                    <div className="purchase-form-field">
                      <label className="purchase-label">Serial No *</label>
                      <input
                        type="text"
                        value={poForm.series}
                        onChange={(e) => handlePoFormChange('series', e.target.value)}
                        className="purchase-input"
                        required
                      />
                    </div>
                    <div className="purchase-form-field">
                      <label className="purchase-label">Date *</label>
                      <input
                        type="date"
                        value={poForm.date}
                        onChange={(e) => handlePoFormChange('date', e.target.value)}
                        className="purchase-input"
                        required
                      />
                    </div>
                    <div className="purchase-form-field">
                      <label className="purchase-label">Supplier Code *</label>
                      <select
                        value={poForm.supplierId}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'create_new') {
                            setCreatingSupplierForPo(true);
                            setActiveTab('supplier');
                            return;
                          }
                          const supplier = suppliers.find(s => s._id === value);
                          if (supplier) {
                            const contact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' };
                            setCurrentPoSupplier(supplier);
                            setPoForm(prev => ({
                              ...prev,
                              supplierId: value,
                              name: supplier.supplier_names.length > 0 ? supplier.supplier_names[0] : supplier.company,
                              supplierCompany: supplier.company,
                              address: contact.address,
                              phone: contact.phone,
                              email: contact.email,
                              currency: supplier.currency
                            }));
                          } else {
                            setCurrentPoSupplier(null);
                          }
                        }}
                        className="purchase-input select"
                        required
                      >
                        <option value="">Select Supplier Code</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{`${s.code} - ${s.company}`}</option>)}
                        <option value="create_new">Create New Supplier</option>
                      </select>
                    </div>
                    <div className="purchase-form-field">
                      <label className="purchase-label">Supplier Name *</label>
                      {currentPoSupplier ? (
                        <select
                          value={poForm.name}
                          onChange={(e) => handlePoFormChange('name', e.target.value)}
                          className="purchase-input select"
                          required
                        >
                          { (currentPoSupplier.supplier_names.length > 0 ? currentPoSupplier.supplier_names : [currentPoSupplier.company]).map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={poForm.name}
                          disabled
                          className="purchase-input"
                        />
                      )}
                    </div>
                    <div className="purchase-form-field">
                      <label className="purchase-label">Supplier Company</label>
                      <input
                        type="text"
                        value={poForm.supplierCompany}
                        disabled
                        className="purchase-input"
                      />
                    </div>
                    <div className="purchase-form-field">
                      <label className="purchase-label">Company *</label>
                      <input
                        type="text"
                        value={poForm.company}
                        onChange={(e) => handlePoFormChange('company', e.target.value)}
                        className="purchase-input"
                        required
                      />
                    </div>
                  </div>
                  <h3>Items</h3>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Item Code *</th>
                        <th>Quantity *</th>
                        <th>UOM *</th>
                        <th>Rate (${poForm.currency})</th>
                        <th>Amount (${poForm.currency})</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poForm.items.map((item, index) => {
                        const selectedItem = items.find(i => i._id === item.itemId);
                        const uomDisplay = item.uom === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                                           item.uom === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                                           item.uom === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="purchase-item-select">
                                <select
                                  value={item.itemId}
                                  onChange={(e) => handlePoItemChange(index, 'itemId', e.target.value)}
                                  className="purchase-input select"
                                  required
                                >
                                  <option value="">Select Item</option>
                                  {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                  <option value="create_new">Create New Item</option>
                                </select>
                                {item.itemId && (
                                  <button onClick={() => {
                                    setEditingItem(selectedItem);
                                    setEditingFrom('order');
                                    setActiveTab('item');
                                  }} className="purchase-button edit">
                                    <FaEdit />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handlePoItemChange(index, 'quantity', e.target.value)}
                                className="purchase-input"
                                required
                              />
                            </td>
                            <td>
                              <select
                                value={item.uom}
                                onChange={(e) => handlePoItemChange(index, 'uom', e.target.value)}
                                className="purchase-input select"
                              >
                                <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                                <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                                <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                                <option value="grams">Grams</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handlePoItemChange(index, 'rate', e.target.value)}
                                className="purchase-input"
                              />
                            </td>
                            <td className="purchase-calculated">
                              {poForm.currency} {(item.amount || 0).toFixed(2)}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => removePoItem(index)}
                                className="purchase-button delete"
                                disabled={poForm.items.length === 1}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="purchase-form-buttons">
                    <button type="button" onClick={addPoItem} className="purchase-button add-row">
                      Add Row
                    </button>
                  </div>
                  <div className="purchase-totals">
                    <div>Total Quantity: {poForm.totalQuantity}</div>
                    <div>Total (${poForm.currency}): {poForm.currency} {(poForm.subtotal || 0).toFixed(2)}</div>
                  </div>
                  <h3>Purchase Taxes and Charges</h3>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Type *</th>
                        <th>Tax Rate</th>
                        <th>Amount (${poForm.currency})</th>
                        <th>Total (${poForm.currency})</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poForm.taxes.length === 0 ? (
                        <tr>
                          <td colSpan="5">No Data</td>
                        </tr>
                      ) : (
                        poForm.taxes.map((tax, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <select
                                value={tax.type}
                                onChange={(e) => handlePoTaxChange(index, 'type', e.target.value)}
                                className="purchase-input select"
                                required
                              >
                                <option value="On Net Total">On Net Total</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={tax.taxRate}
                                onChange={(e) => handlePoTaxChange(index, 'taxRate', e.target.value)}
                                className="purchase-input"
                                required
                              />
                            </td>
                            <td className="purchase-calculated">
                              {poForm.currency} {(tax.amount || 0).toFixed(2)}
                            </td>
                            <td className="purchase-calculated">
                              {poForm.currency} {(tax.total || 0).toFixed(2)}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => removePoTax(index)}
                                className="purchase-button delete"
                                disabled={poForm.taxes.length === 1}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="purchase-form-buttons">
                    <button type="button" onClick={addPoTax} className="purchase-button add-row">
                      Add Row
                    </button>
                  </div>
                  <div className="purchase-totals">
                    <div>Total Qty {poForm.commonUOM || 'Carton'} {poForm.totalQtyInCommon.toFixed(0)}</div>
                    <div>Gross Amount {poForm.currency} {(poForm.subtotal || 0).toFixed(0)}</div>
                    {poForm.taxes.map((tax, index) => (
                      <div key={index}>GST {tax.taxRate}% {poForm.currency} {(tax.amount || 0).toFixed(0)}</div>
                    ))}
                    <div>Net Total {poForm.currency} {(poForm.grandTotal || 0).toFixed(0)}</div>
                  </div>
                </div>
              </div>
          )}
          {activeTab === 'receipt' && (
            <div className="purchase-section">
              <div className="purchase-header">
                <h3>Purchase Receipt</h3>
                <div className="purchase-filter-group-center">
                  <FaFilter className="purchase-icon" onClick={() => setShowPrFilters(!showPrFilters)} />
                  {showPrFilters && (
                    <div className="purchase-filter-dropdown">
                      <button onClick={() => setShowPrDateFilter(!showPrDateFilter)} className="purchase-button filter-option">
                        {showPrDateFilter ? 'Hide' : 'Show'} Date Filter
                      </button>
                      <button onClick={() => setShowPrSupplierFilter(!showPrSupplierFilter)} className="purchase-button filter-option">
                        {showPrSupplierFilter ? 'Hide' : 'Show'} Supplier Filter
                      </button>
                      <button onClick={() => setShowPrItemFilter(!showPrItemFilter)} className="purchase-button filter-option">
                        {showPrItemFilter ? 'Hide' : 'Show'} Item Filter
                      </button>
                    </div>
                  )}
                </div>
                <div className="purchase-active-filters">
                  {showPrDateFilter && (
                    <>
                      <label>From: <input type="date" value={prDateFrom} onChange={(e) => setPrDateFrom(e.target.value)} className="purchase-input" /></label>
                      <label>To: <input type="date" value={prDateTo} onChange={(e) => setPrDateTo(e.target.value)} className="purchase-input" /></label>
                    </>
                  )}
                  {showPrSupplierFilter && (
                    <select
                      value={prSelectedSupplier}
                      onChange={(e) => setPrSelectedSupplier(e.target.value)}
                      className="purchase-input select"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  )}
                  {showPrItemFilter && (
                    <select
                      value={prSelectedItem}
                      onChange={(e) => setPrSelectedItem(e.target.value)}
                      className="purchase-input select"
                    >
                      <option value="">All Items</option>
                      {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="purchase-filter-group-right">
                  <button type="button" onClick={handlePrSave} className="purchase-button save">Save</button>
                  <button type="button" onClick={handlePrSubmit} className="purchase-button submit">Submit</button>
                </div>
              </div>
              <div className="purchase-form">
                <div className="purchase-form-grid">
                  <div className="purchase-form-field">
                    <label className="purchase-label">Series *</label>
                    <input
                      type="text"
                      value={prForm.series}
                      onChange={(e) => handlePrFormChange('series', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Date *</label>
                    <input
                      type="date"
                      value={prForm.date}
                      onChange={(e) => handlePrFormChange('date', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Company *</label>
                    <input
                      type="text"
                      value={prForm.company}
                      onChange={(e) => handlePrFormChange('company', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Purchase Order *</label>
                    <select
                      value={prForm.poId}
                      onChange={(e) => {
                        const poId = e.target.value;
                        const po = purchaseOrders.find(p => p.series === poId);
                        if (po) {
                          const supplier = suppliers.find(s => s._id === po.supplierId);
                          const contact = supplier ? (supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }) : { address: '', phone: '', email: '' };
                          const newItems = po.items.map(item => ({
                            itemId: item.itemId,
                            originalQuantity: item.quantity,
                            acceptedQuantity: item.quantity,
                            rejectedQuantity: 0,
                            rate: item.rate,
                            amount: item.quantity * item.rate,
                            unit: item.uom
                          }));
                          setCurrentPrSupplier(supplier);
                          const newForm = {
                            ...prForm,
                            poId,
                            supplierId: po.supplierId,
                            name: po.name,
                            supplierCompany: po.supplierCompany,
                            address: contact.address || po.address,
                            phone: contact.phone || po.phone,
                            email: contact.email || po.email,
                            items: newItems,
                            taxes: po.taxes,
                            currency: po.currency
                          };
                          setPrForm({ ...newForm, ...calculatePrTotals(newForm) });
                        }
                      }}
                      className="purchase-input select"
                      required
                    >
                      <option value="">Select PO</option>
                      {purchaseOrders.filter(po => po.status === 'Submitted').map(po => (
                        <option key={po.series} value={po.series}>{po.series}</option>
                      ))}
                    </select>
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Code</label>
                    <input
                      type="text"
                      value={suppliers.find(s => s._id === prForm.supplierId)?.code || ''}
                      disabled
                      className="purchase-input"
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Name *</label>
                    {currentPrSupplier ? (
                      <select
                        value={prForm.name}
                        onChange={(e) => handlePrFormChange('name', e.target.value)}
                        className="purchase-input select"
                        required
                      >
                        { (currentPrSupplier.supplier_names.length > 0 ? currentPrSupplier.supplier_names : [currentPrSupplier.company]).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={prForm.name}
                        disabled
                        className="purchase-input"
                      />
                    )}
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Company</label>
                    <input
                      type="text"
                      value={prForm.supplierCompany}
                      disabled
                      className="purchase-input"
                    />
                  </div>
                </div>
                <h3>Items</h3>
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Item Code *</th>
                      <th>Accepted Quantity</th>
                      <th>Rejected Q...</th>
                      <th>Rate (${prForm.currency})</th>
                      <th>Amount (${prForm.currency})</th>
                      <th>UOM</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prForm.items.map((item, index) => {
                      const selectedItem = items.find(i => i._id === item.itemId);
                      const uomDisplay = item.unit === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                                         item.unit === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                                         item.unit === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="purchase-item-select">
                              <select
                                value={item.itemId}
                                onChange={(e) => handlePrItemChange(index, 'itemId', e.target.value)}
                                className="purchase-input select"
                                required
                              >
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                <option value="create_new">Create New Item</option>
                              </select>
                              {item.itemId && (
                                <button onClick={() => {
                                  setEditingItem(selectedItem);
                                  setEditingFrom('receipt');
                                  setActiveTab('item');
                                }} className="purchase-button edit">
                                  <FaEdit />
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.acceptedQuantity}
                              onChange={(e) => handlePrItemChange(index, 'acceptedQuantity', e.target.value)}
                              className="purchase-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.rejectedQuantity}
                              onChange={(e) => handlePrItemChange(index, 'rejectedQuantity', e.target.value)}
                              className="purchase-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handlePrItemChange(index, 'rate', e.target.value)}
                              className="purchase-input"
                            />
                          </td>
                          <td className="purchase-calculated">
                            {prForm.currency} {(item.amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <select
                              value={item.unit}
                              onChange={(e) => handlePrItemChange(index, 'unit', e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                              <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                              <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                              <option value="grams">Grams</option>
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removePrItem(index)}
                              className="purchase-button delete"
                              disabled={prForm.items.length === 1}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="purchase-form-buttons">
                  <button type="button" onClick={addPrItem} className="purchase-button add-row">
                    Add Row
                  </button>
                </div>
                <div className="purchase-totals">
                  <div>Net Total (${prForm.currency}): {prForm.currency} {(prForm.subtotal || 0).toFixed(2)}</div>
                </div>
                <h3>Purchase Taxes and Charges</h3>
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Type *</th>
                      <th>Tax Rate</th>
                      <th>Amount (${prForm.currency})</th>
                      <th>Total (${prForm.currency})</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prForm.taxes.map((tax, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <select
                            value={tax.type}
                            onChange={(e) => handlePrTaxChange(index, 'type', e.target.value)}
                            className="purchase-input select"
                            required
                          >
                            <option value="On Net Total">On Net Total</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={tax.taxRate}
                            onChange={(e) => handlePrTaxChange(index, 'taxRate', e.target.value)}
                            className="purchase-input"
                          />
                        </td>
                        <td className="purchase-calculated">
                          {prForm.currency} {(tax.amount || 0).toFixed(2)}
                        </td>
                        <td className="purchase-calculated">
                          {prForm.currency} {(tax.total || 0).toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removePrTax(index)}
                            className="purchase-button delete"
                            disabled={prForm.taxes.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="purchase-form-buttons">
                  <button type="button" onClick={addPrTax} className="purchase-button add-row">
                    Add Row
                  </button>
                </div>
                <div className="purchase-totals">
                  <div>Total Qty {prForm.commonUOM || 'Carton'} {prForm.totalQtyInCommon.toFixed(0)}</div>
                  <div>Gross Amount {prForm.currency} {(prForm.subtotal || 0).toFixed(0)}</div>
                  {prForm.taxes.map((tax, index) => (
                    <div key={index}>GST {tax.taxRate}% {prForm.currency} {(tax.amount || 0).toFixed(0)}</div>
                  ))}
                  <div>Net Total {prForm.currency} {(prForm.grandTotal || 0).toFixed(0)}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'invoice' && (
            <div className="purchase-section">
              <div className="purchase-header">
                <h3>Purchase Invoice</h3>
                <div className="purchase-filter-group-center">
                  <FaFilter className="purchase-icon" onClick={() => setShowPiFilters(!showPiFilters)} />
                  {showPiFilters && (
                    <div className="purchase-filter-dropdown">
                      <button onClick={() => setShowPiDateFilter(!showPiDateFilter)} className="purchase-button filter-option">
                        {showPiDateFilter ? 'Hide' : 'Show'} Date Filter
                      </button>
                      <button onClick={() => setShowPiSupplierFilter(!showPiSupplierFilter)} className="purchase-button filter-option">
                        {showPiSupplierFilter ? 'Hide' : 'Show'} Supplier Filter
                      </button>
                      <button onClick={() => setShowPiItemFilter(!showPiItemFilter)} className="purchase-button filter-option">
                        {showPiItemFilter ? 'Hide' : 'Show'} Item Filter
                      </button>
                    </div>
                  )}
                </div>
                <div className="purchase-active-filters">
                  {showPiDateFilter && (
                    <>
                      <label>From: <input type="date" value={piDateFrom} onChange={(e) => setPiDateFrom(e.target.value)} className="purchase-input" /></label>
                      <label>To: <input type="date" value={piDateTo} onChange={(e) => setPiDateTo(e.target.value)} className="purchase-input" /></label>
                    </>
                  )}
                  {showPiSupplierFilter && (
                    <select
                      value={piSelectedSupplier}
                      onChange={(e) => setPiSelectedSupplier(e.target.value)}
                      className="purchase-input select"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  )}
                  {showPiItemFilter && (
                    <select
                      value={piSelectedItem}
                      onChange={(e) => setPiSelectedItem(e.target.value)}
                      className="purchase-input select"
                    >
                      <option value="">All Items</option>
                      {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="purchase-filter-group-right">
                  <button type="button" onClick={handlePiSave} className="purchase-button save">Save</button>
                  <button type="button" onClick={handlePiSubmit} className="purchase-button submit">Submit</button>
                </div>
              </div>
              <div className="purchase-form">
                <div className="purchase-form-grid">
                  <div className="purchase-form-field">
                    <label className="purchase-label">Series *</label>
                    <input
                      type="text"
                      value={piForm.series}
                      onChange={(e) => handlePiFormChange('series', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Date *</label>
                    <input
                      type="date"
                      value={piForm.date}
                      onChange={(e) => handlePiFormChange('date', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Code *</label>
                    <select
                      value={piForm.supplierId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'create_new') {
                          setCreatingSupplierForPi(true);
                          setActiveTab('supplier');
                          return;
                        }
                        const supplier = suppliers.find(s => s._id === value);
                        if (supplier) {
                          const contact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' };
                          setCurrentPiSupplier(supplier);
                          setPiForm(prev => ({
                            ...prev,
                            supplierId: value,
                            name: supplier.supplier_names.length > 0 ? supplier.supplier_names[0] : supplier.company,
                            supplierCompany: supplier.company,
                            address: contact.address,
                            phone: contact.phone,
                            email: contact.email
                          }));
                        } else {
                          setCurrentPiSupplier(null);
                        }
                      }}
                      className="purchase-input select"
                      required
                    >
                      <option value="">Select Supplier Code</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{`${s.code} - ${s.company}`}</option>)}
                      <option value="create_new">Create New Supplier</option>
                    </select>
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Name *</label>
                    {currentPiSupplier ? (
                      <select
                        value={piForm.name}
                        onChange={(e) => handlePiFormChange('name', e.target.value)}
                        className="purchase-input select"
                        required
                      >
                        { (currentPiSupplier.supplier_names.length > 0 ? currentPiSupplier.supplier_names : [currentPiSupplier.company]).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={piForm.name}
                        disabled
                        className="purchase-input"
                      />
                    )}
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Supplier Company</label>
                    <input
                      type="text"
                      value={piForm.supplierCompany}
                      disabled
                      className="purchase-input"
                    />
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Purchase Order</label>
                    <select
                      value={piForm.poId}
                      onChange={(e) => handlePiFormChange('poId', e.target.value)}
                      className="purchase-input select"
                    >
                      <option value="">Select PO</option>
                      {purchaseOrders.filter(po => po.status === 'Submitted').map(po => (
                        <option key={po.series} value={po.series}>{po.series}</option>
                      ))}
                    </select>
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Purchase Receipt *</label>
                    <select
                      value={piForm.prId}
                      onChange={(e) => {
                        const prId = e.target.value;
                        const pr = purchaseReceipts.find(p => p.series === prId);
                        if (pr) {
                          const supplier = suppliers.find(s => s._id === pr.supplierId);
                          const contact = supplier ? (supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }) : { address: '', phone: '', email: '' };
                          const newItems = pr.items.map(item => ({
                            itemId: item.itemId,
                            acceptedQuantity: item.acceptedQuantity,
                            rate: item.rate,
                            amount: item.acceptedQuantity * item.rate,
                            unit: item.unit
                          }));
                          setCurrentPiSupplier(supplier);
                          const newForm = {
                            ...piForm,
                            prId,
                            poId: pr.poId,
                            supplierId: pr.supplierId,
                            name: pr.name,
                            supplierCompany: pr.supplierCompany,
                            address: contact.address || pr.address,
                            phone: contact.phone || pr.phone,
                            email: contact.email || pr.email,
                            items: newItems,
                            taxes: pr.taxes,
                            currency: pr.currency
                          };
                          setPiForm({ ...newForm, ...calculatePiTotals(newForm) });
                        }
                      }}
                      className="purchase-input select"
                      required
                    >
                     <option value="">Select PR</option>
                      {purchaseReceipts.filter(pr => pr.status === 'Submitted').map(pr => (
                        <option key={pr.series} value={pr.series}>{pr.series}</option>
                      ))}
                    </select>
                  </div>
                  <div className="purchase-form-field">
                    <label className="purchase-label">Company *</label>
                    <input
                      type="text"
                      value={piForm.company}
                     onChange={(e) => handlePiFormChange('company', e.target.value)}
                      className="purchase-input"
                      required
                    />
                  </div>
                </div>
                <h3>Items</h3>
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Item Code *</th>
                      <th>Accepted Quantity *</th>
                      <th>UOM</th>
                      <th>Rate (${piForm.currency})</th>
                      <th>Amount (${piForm.currency})</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {piForm.items.map((item, index) => {
                      const selectedItem = items.find(i => i._id === item.itemId);
                      const uomDisplay = item.unit === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                                         item.unit === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                                         item.unit === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="purchase-item-select">
                              <select
                                value={item.itemId}
                                onChange={(e) => handlePiItemChange(index, 'itemId', e.target.value)}
                                className="purchase-input select"
                                required
                              >
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                <option value="create_new">Create New Item</option>
                              </select>
                              {item.itemId && (
                                <button onClick={() => {
                                  setEditingItem(selectedItem);
                                  setEditingFrom('invoice');
                                  setActiveTab('item');
                                }} className="purchase-button edit">
                                  <FaEdit />
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.acceptedQuantity}
                              onChange={(e) => handlePiItemChange(index, 'acceptedQuantity', e.target.value)}
                              className="purchase-input"
                              required
                            />
                          </td>
                          <td>
                            <select
                              value={item.unit}
                              onChange={(e) => handlePiItemChange(index, 'unit', e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                              <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                              <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                              <option value="grams">Grams</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handlePiItemChange(index, 'rate', e.target.value)}
                              className="purchase-input"
                            />
                          </td>
                          <td className="purchase-calculated">
                            {piForm.currency} {(item.amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removePiItem(index)}
                              className="purchase-button delete"
                              disabled={piForm.items.length === 1}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="purchase-form-buttons">
                  <button type="button" onClick={addPiItem} className="purchase-button add-row">
                    Add Row
                  </button>
                </div>
                <div className="purchase-totals">
                  <div>Total Quantity: {piForm.totalQuantity}</div>
                  <div>Total (${piForm.currency}): {piForm.currency} {(piForm.subtotal || 0).toFixed(2)}</div>
                </div>
                <h3>Purchase Taxes and Charges</h3>
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Type *</th>
                      <th>Tax Rate</th>
                      <th>Amount (${piForm.currency})</th>
                      <th>Total (${piForm.currency})</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {piForm.taxes.length === 0 ? (
                      <tr>
                        <td colSpan="5">No Data</td>
                      </tr>
                    ) : (
                      piForm.taxes.map((tax, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <select
                              value={tax.type}
                              onChange={(e) => handlePiTaxChange(index, 'type', e.target.value)}
                              className="purchase-input select"
                              required
                            >
                              <option value="On Net Total">On Net Total</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={tax.taxRate}
                              onChange={(e) => handlePiTaxChange(index, 'taxRate', e.target.value)}
                              className="purchase-input"
                              required
                            />
                          </td>
                          <td className="purchase-calculated">
                            {piForm.currency} {(tax.amount || 0).toFixed(2)}
                          </td>
                          <td className="purchase-calculated">
                            {piForm.currency} {(tax.total || 0).toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removePiTax(index)}
                              className="purchase-button delete"
                              disabled={piForm.taxes.length === 1}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="purchase-form-buttons">
                  <button type="button" onClick={addPiTax} className="purchase-button add-row">
                    Add Row
                  </button>
                </div>
                <div className="purchase-totals">
                  <div>Total Qty {piForm.commonUOM || 'Carton'} {piForm.totalQtyInCommon.toFixed(0)}</div>
                  <div>Gross Amount {piForm.currency} {(piForm.subtotal || 0).toFixed(0)}</div>
                  {piForm.taxes.map((tax, index) => (
                    <div key={index}>GST {tax.taxRate}% {piForm.currency} {(tax.amount || 0).toFixed(0)}</div>
                  ))}
                  <div>Net Total {piForm.currency} {(piForm.grandTotal || 0).toFixed(0)}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'report' && (
            <div className="purchase-section">
              <div className="purchase-header">
                <h3>Reports</h3>
                <div className="purchase-report-buttons">
                  <button onClick={() => setActiveReport('stock')} className={`purchase-button report ${activeReport === 'stock' ? 'active' : ''}`}>
                    Stock Balance
                  </button>
                  <button onClick={() => setActiveReport('sales')} className={`purchase-button report ${activeReport === 'sales' ? 'active' : ''}`}>
                    SalesReport
                  </button>
                  <button onClick={() => setActiveReport('po')} className={`purchase-button report ${activeReport === 'po' ? 'active' : ''}`}>
                    Purchase Orders
                  </button>
                  <button onClick={() => setActiveReport('pr')} className={`purchase-button report ${activeReport === 'pr' ? 'active' : ''}`}>
                    Purchase Receipts
                  </button>
                  <button onClick={() => setActiveReport('pi')} className={`purchase-button report ${activeReport === 'pi' ? 'active' : ''}`}>
                    Purchase Invoices
                  </button>
                  <button onClick={() => setActiveReport('supplier')} className={`purchase-button report ${activeReport === 'supplier' ? 'active' : ''}`}>
                    Suppliers
                  </button>
                </div>
              </div>
              {activeReport === 'stock' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search items by name"
                            value={reportSearch}
                            onChange={(e) => setReportSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <h4>Stock Balance</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Total Stock (Carton)</th>
                        <th>Total Stock (Packet)</th>
                        <th>Total Stock (Patties)</th>
                        <th>Total Purchased (Patties)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportItems.map(item => (
                        <tr key={item._id}>
                          <td>{item.name}</td>
                          <td>{item.stockMaster} {item.masterUnit}</td>
                          <td>{item.stockOuter} {item.outerUnit}</td>
                          <td>{item.stockNos} {item.nosUnit}</td>
                          <td>{item.totalPurchased || (item.totalStock + (item.soldNos || 0))} {item.nosUnit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {activeReport === 'sales' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search items by name"
                            value={reportSearch}
                            onChange={(e) => setReportSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <h4>Sales Report</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Total Sold (Patty)</th>
                        <th>Total Purchased (Patty)</th>
                        <th>Remaining Stock (Patty)</th>
                        <th>Nos (patty)</th>
                        <th>Quantity (patty)</th>
                        <th>Record Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportItems.map(item => {
                        const totalPurchased = item.totalPurchased || (item.totalStock + (item.soldNos || 0));
                        const remainingPatties = item.totalStock;
                        const uom = saleUoms[item._id] || 'nos';
                        const uomLabel = uom === 'master' ? item.masterUnit : uom === 'outer' ? item.outerUnit : item.nosUnit;
                        return (
                          <tr key={item._id}>
                            <td>{item.name}</td>
                            <td>{item.soldNos} {item.nosUnit}</td>
                            <td>{totalPurchased} {item.nosUnit}</td>
                            <td>{remainingPatties} {item.nosUnit}</td>
                            <td>
                              <select
                                value={uom}
                                onChange={(e) => setSaleUoms({ ...saleUoms, [item._id]: e.target.value })}
                                className="purchase-input select"
                              >
                                <option value="master">Master ({item.masterUnit})</option>
                                <option value="outer">Outer ({item.outerUnit})</option>
                                <option value="nos">Nos ({item.nosUnit})</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={saleQuantities[item._id] || ''}
                                onChange={(e) => setSaleQuantities({ ...saleQuantities, [item._id]: e.target.value })}
                                placeholder={`Quantity (${uomLabel})`}
                                className="purchase-input"
                              />
                            </td>
                            <td>
                              <button onClick={() => handleRecordSale(item._id)} className="purchase-button submit">
                                Record Sale
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
              {activeReport === 'po' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search by PO Number"
                            value={reportPoSearch}
                            onChange={(e) => setReportPoSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                        <label>Supplier:
                          <select
                            value={reportPoSupplier}
                            onChange={(e) => setReportPoSupplier(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                        </label>
                        <label>Status:
                          <select
                            value={reportPoStatus}
                            onChange={(e) => setReportPoStatus(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                          </select>
                        </label>
                      </div>
                      <div className="purchase-report-filters-right">
                        <label>From: <input type="date" value={reportPoDateFrom} onChange={(e) => setReportPoDateFrom(e.target.value)} className="purchase-input" /></label>
                        <label>To: <input type="date" value={reportPoDateTo} onChange={(e) => setReportPoDateTo(e.target.value)} className="purchase-input" /></label>
                      </div>
                    </div>
                    <div className="purchase-report-actions">
                      <button onClick={() => handleExportCSV('po')} className="purchase-button export">
                        <FaFileExcel /> Export CSV
                      </button>
                      <button onClick={() => handlePrintTable('po')} className="purchase-button print">
                        <FaPrint /> Print
                      </button>
                    </div>
                  </div>
                  <h4>Purchase Orders Report</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Date</th>
                        <th>Supplier Name</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchaseOrdersReport.map(po => (
                        <tr key={po._id} onClick={() => editPo(po._id)}>
                          <td>{po.series}</td>
                          <td>{new Date(po.date).toLocaleDateString()}</td>
                          <td>{po.name}</td>
                          <td>{po.items.map(item => <div key={item.itemId}>{renderItemQuantity(item, 'po')}</div>)}</td>
                          <td>{po.currency} {(po.grandTotal || 0).toFixed(2)}</td>
                          <td>{po.status}</td>
                          <td className="purchase-action-buttons">
                            {po.status === 'Draft' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); editPo(po._id); }} className="purchase-button edit">
                                  <FaEdit /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); submitPo(po._id); }} className="purchase-button submit">
                                  <FaCheck /> Submit
                                </button>
                              </>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handlePrintRow('po', po); }} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deletePo(po._id); }} className="purchase-button delete">
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4"><strong>Grand Total</strong></td>
                        <td><strong>{calculateGrandTotal(filteredPurchaseOrdersReport).toFixed(2)}</strong></td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
              {activeReport === 'pr' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search by PR Number"
                            value={reportPrSearch}
                            onChange={(e) => setReportPrSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                        <label>Supplier:
                          <select
                            value={reportPrSupplier}
                            onChange={(e) => setReportPrSupplier(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                        </label>
                        <label>Status:
                          <select
                            value={reportPrStatus}
                            onChange={(e) => setReportPrStatus(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                          </select>
                        </label>
                      </div>
                      <div className="purchase-report-filters-right">
                        <label>From: <input type="date" value={reportPrDateFrom} onChange={(e) => setReportPrDateFrom(e.target.value)} className="purchase-input" /></label>
                        <label>To: <input type="date" value={reportPrDateTo} onChange={(e) => setReportPrDateTo(e.target.value)} className="purchase-input" /></label>
                      </div>
                    </div>
                    <div className="purchase-report-actions">
                      <button onClick={() => handleExportCSV('pr')} className="purchase-button export">
                        <FaFileExcel /> Export CSV
                      </button>
                      <button onClick={() => handlePrintTable('pr')} className="purchase-button print">
                        <FaPrint /> Print
                      </button>
                    </div>
                  </div>
                  <h4>Purchase Receipts Report</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>PR Number</th>
                        <th>PO Reference</th>
                        <th>Date</th>
                        <th>Supplier Name</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchaseReceiptsReport.map(pr => (
                        <tr key={pr.series} onClick={() => editPr(pr.series)}>
                          <td>{pr.series}</td>
                          <td>{pr.poId}</td>
                          <td>{new Date(pr.date).toLocaleDateString()}</td>
                          <td>{pr.name}</td>
                          <td>{pr.items.map(item => <div key={item.itemId}>{renderItemQuantity(item, 'pr')}</div>)}</td>
                          <td>{pr.currency} {(pr.grandTotal || 0).toFixed(2)}</td>
                          <td>{pr.status}</td>
                          <td className="purchase-action-buttons">
                            {pr.status === 'Draft' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); editPr(pr.series); }} className="purchase-button edit">
                                  <FaEdit /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); submitPr(pr.series); }} className="purchase-button submit">
                                  <FaCheck /> Submit
                                </button>
                              </>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handlePrintRow('pr', pr); }} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deletePr(pr.series); }} className="purchase-button delete">
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5"><strong>Grand Total</strong></td>
                        <td><strong>{calculateGrandTotal(filteredPurchaseReceiptsReport).toFixed(2)}</strong></td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
              {activeReport === 'pi' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search by PI Number"
                            value={reportPiSearch}
                            onChange={(e) => setReportPiSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                        <label>Supplier:
                          <select
                            value={reportPiSupplier}
                            onChange={(e) => setReportPiSupplier(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                        </label>
                        <label>Status:
                          <select
                            value={reportPiStatus}
                            onChange={(e) => setReportPiStatus(e.target.value)}
                            className="purchase-input select"
                          >
                            <option value="">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                          </select>
                        </label>
                      </div>
                      <div className="purchase-report-filters-right">
                        <label>From: <input type="date" value={reportPiDateFrom} onChange={(e) => setReportPiDateFrom(e.target.value)} className="purchase-input" /></label>
                        <label>To: <input type="date" value={reportPiDateTo} onChange={(e) => setReportPiDateTo(e.target.value)} className="purchase-input" /></label>
                      </div>
                    </div>
                    <div className="purchase-report-actions">
                      <button onClick={() => handleExportCSV('pi')} className="purchase-button export">
                        <FaFileExcel /> Export CSV
                      </button>
                      <button onClick={() => handlePrintTable('pi')} className="purchase-button print">
                        <FaPrint /> Print
                      </button>
                    </div>
                  </div>
                  <h4>Purchase Invoices Report</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>PI Number</th>
                        <th>Date</th>
                        <th>Supplier Name</th>
                        <th>PO Reference</th>
                        <th>PR Reference</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchaseInvoicesReport.map(pi => (
                        <tr key={pi.series} onClick={() => editPi(pi.series)}>
                          <td>{pi.series}</td>
                          <td>{new Date(pi.date).toLocaleDateString()}</td>
                          <td>{pi.name}</td>
                          <td>{pi.poId}</td>
                          <td>{pi.prId}</td>
                          <td>{pi.currency} {(pi.grandTotal || 0).toFixed(2)}</td>
                          <td>{pi.status}</td>
                          <td className="purchase-action-buttons">
                            {pi.status === 'Draft' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); editPi(pi.series); }} className="purchase-button edit">
                                  <FaEdit /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); submitPi(pi.series); }} className="purchase-button submit">
                                  <FaCheck /> Submit
                                </button>
                              </>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handlePrintRow('pi', pi); }} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deletePi(pi.series); }} className="purchase-button delete">
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5"><strong>Grand Total</strong></td>
                        <td><strong>{calculateGrandTotal(filteredPurchaseInvoicesReport).toFixed(2)}</strong></td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
              {activeReport === 'supplier' && (
                <>
                  <div className="purchase-report-top">
                    <div className="purchase-report-filters">
                      <div className="purchase-report-filters-left">
                        <label>Search:
                          <input
                            type="text"
                            placeholder="Search by Name or Code"
                            value={reportSupplierSearch}
                            onChange={(e) => setReportSupplierSearch(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                        <label>Group:
                          <input
                            type="text"
                            placeholder="Filter by Group"
                            value={reportSupplierGroup}
                            onChange={(e) => setReportSupplierGroup(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                        <label>Country:
                          <input
                            type="text"
                            placeholder="Filter by Country"
                            value={reportSupplierCountry}
                            onChange={(e) => setReportSupplierCountry(e.target.value)}
                            className="purchase-input"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="purchase-report-actions">
                      <button onClick={() => handleExportCSV('supplier')} className="purchase-button export">
                        <FaFileExcel /> Export CSV
                      </button>
                      <button onClick={() => handlePrintTable('supplier')} className="purchase-button print">
                        <FaPrint /> Print
                      </button>
                    </div>
                  </div>
                  <h4>Suppliers Report</h4>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Company Name</th>
                        <th>Supplier Names</th>
                        <th>Group</th>
                        <th>Country</th>
                        <th>Currency</th>
                        <th>Tax ID</th>
                        <th>Contacts</th>
                        <th>Last Purchase Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliersReport.map(supplier => (
                        <tr key={supplier._id} onClick={() => { setEditingSupplier(supplier); setSupplierNames(supplier.supplier_names || ['']); setActiveTab('supplier'); }}>
                          <td>{supplier.code}</td>
                          <td>{supplier.company}</td>
                          <td>{(supplier.supplier_names || []).join(', ')}</td>
                          <td>{supplier.group}</td>
                          <td>{supplier.country}</td>
                          <td>{supplier.currency}</td>
                          <td>{supplier.taxId}</td>
                          <td>{Array.isArray(supplier.contacts) ? supplier.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : ''}</td>
                          <td>{supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                          <td className="purchase-action-buttons">
                            <button onClick={(e) => { e.stopPropagation(); setEditingSupplier(supplier); setSupplierNames(supplier.supplier_names || ['']); setActiveTab('supplier'); }} className="purchase-button edit">
                              <FaEdit /> Edit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSupplier(supplier._id); }} className="purchase-button delete">
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Purchase;