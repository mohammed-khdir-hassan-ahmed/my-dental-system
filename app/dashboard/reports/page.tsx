"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Download, Filter, CalendarDays, Eye, FileText, Users, DollarSign, Wallet, TrendingUp, Loader2, RotateCcw, User, TrendingDown, Printer, Calendar } from "lucide-react"
import {
  notifyActionError,
  notifyPdfExported,
  notifyPdfError,
  notifyPaymentAmountSynced,
} from '@/lib/notify'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DashboardPageShell,
  mobileInset,
  mobileTableShell,
  mobileTableScroll,
  mobileTableMin,
  mobileTh,
  mobileTd,
  mobileTdPrimary,
  mobileDialogContentWide,
} from "@/components/dashboard-page-shell"

type ReportType = "expenses" | "installments" | "employees" | "sales" | "payment-history" | "appointments"

const MIN_REPORT_YEAR = 2026
const REPORT_YEAR_LOOKAHEAD = 5

const KURDISH_MONTHS = [
  'مانگی ١', 'مانگی ٢', 'مانگی ٣', 'مانگی ٤', 'مانگی ٥', 'مانگی ٦',
  'مانگی ٧', 'مانگی ٨', 'مانگی ٩', 'مانگی ١٠', 'مانگی ١١', 'مانگی ١٢',
]

type Expense = {
  id: string
  title: string
  amount: string
  category: string
  paymentMethod: string
  date: string
  note: string | null
}

type Employee = {
  id: number
  fullName: string
  role: string
  phonenumber: string
  basicSalary: string
  age: string | null
  address: string | null
  status: string
  date: string
  createdAt?: string | null
}

type PayrollRecord = {
  id: number
  staffId: number
  amount: string
  type: 'Advance' | 'Salary'
  date: string
  note: string | null
  monthKey: string
  isPaid: boolean
}

type EmployeePayrollReport = {
  employee: Employee
  basicSalary: number
  advances: PayrollRecord[]
  totalAdvances: number
  remainingSalary: number
}

type Sale = {
  id: number
  productName: string
  category: string
  price: number
  quantity: number
  totalPrice: number
  profit: number
  date: string
  notes?: string
  createdAt?: string
}

type Installment = {
  id: number
  patientName: string
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  installmentValue: string
  nextPaymentDate: string | null
  status: 'Paid' | 'Pending' | 'Overdue'
  createdAt: string
  paymentHistory?: { paymentDate: string; amountPaid: string }[]
  age?: string
  phoneNumber?: string
  address?: string
}

type PaymentHistory = {
  id: number
  installmentId: number
  amountPaid: string
  paymentDate: string
  createdAt: string
  patientName: string
  installmentNumber?: number
}

type Appointment = {
  id: number
  name: string
  gender: string
  phone: string
  age: number
  treatmentType: string
  appointmentDate: string
  money?: string | number
}

interface PaymentFormData {
  amountPaid: string;
  paymentDate: string;
}

interface InstallmentPaymentFormData extends PaymentFormData {
  installmentId?: number;
}

const reportTabs: { key: ReportType; label: string; shortLabel: string; icon: typeof Wallet }[] = [
  { key: "expenses", label: "ڕاپۆرتی خەرجیەکان", shortLabel: "خەرجیەکان", icon: Wallet },
  { key: "employees", label: "ڕاپۆرتی کارمەندەکان", shortLabel: "کارمەندەکان", icon: User },
  { key: "installments", label: "ڕاپۆرتی قیستەکان", shortLabel: "قیستەکان", icon: TrendingUp },
  { key: "sales", label: "ڕاپۆرتی فرۆشتن", shortLabel: "فرۆشتن", icon: DollarSign },
  { key: "appointments", label: "ڕاپۆرتی سەرەبڕین", shortLabel: "سەرەبڕین", icon: Calendar },
]

function formatMoney(value: string | number) {
  const numeric = Number(value) || 0
  return `${numeric.toLocaleString("en-US")} د.ع`
}

function formatAppointmentMoney(value: string | number) {
  const numeric = Number(value) || 0
  return `${numeric.toLocaleString("en-US")} هەزار`
}

function formatDate(dateValue: string) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleDateString("en-CA")
}

function matchesMonthYear(dateValue: string, year: number, month: number) {
  const current = new Date(dateValue)
  if (Number.isNaN(current.getTime())) return false
  return current.getFullYear() === year && current.getMonth() + 1 === month
}

function collectYearsFromDates(...dateValues: string[]) {
  const years = new Set<number>()
  for (const dateValue of dateValues) {
    if (!dateValue) continue
    const year = new Date(dateValue).getFullYear()
    if (Number.isFinite(year) && year >= MIN_REPORT_YEAR) {
      years.add(year)
    }
  }
  return years
}

function buildAvailableReportYears(
  payrollYears: number[],
  expenses: Expense[],
  sales: Sale[],
  installments: Installment[],
  paymentHistory: PaymentHistory[],
  appointments: Appointment[],
) {
  const years = new Set<number>()
  const currentYear = new Date().getFullYear()
  const endYear = currentYear + REPORT_YEAR_LOOKAHEAD

  for (let y = MIN_REPORT_YEAR; y <= endYear; y++) {
    years.add(y)
  }

  payrollYears.forEach((y) => {
    if (y >= MIN_REPORT_YEAR) years.add(y)
  })

  collectYearsFromDates(
    ...expenses.map((e) => e.date),
    ...sales.map((s) => s.date),
    ...installments.map((i) => i.createdAt),
    ...paymentHistory.map((p) => p.paymentDate),
    ...appointments.map((a) => a.appointmentDate),
  ).forEach((y) => years.add(y))

  const sorted = Array.from(years).sort((a, b) => b - a)
  return sorted.length > 0 ? sorted : [MIN_REPORT_YEAR]
}

function ReportsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type")
  const activeReport: ReportType =
    typeParam === "installments" ? "installments" :
    typeParam === "employees" ? "employees" :
    typeParam === "sales" ? "sales" :
    typeParam === "appointments" ? "appointments" :
    typeParam === "payment-history" ? "payment-history" : "expenses"

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [monthlyRecords, setMonthlyRecords] = useState<PayrollRecord[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [syncingPayment, setSyncingPayment] = useState(false)

  const currentDate = new Date()
  const [selectedReportYear, setSelectedReportYear] = useState(
    Math.max(MIN_REPORT_YEAR, currentDate.getFullYear())
  )
  const [selectedReportMonth, setSelectedReportMonth] = useState(currentDate.getMonth() + 1)

  const reportPeriodLabel = `${KURDISH_MONTHS[selectedReportMonth - 1]} ${selectedReportYear}`
  const reportMonthKey = `${String(selectedReportMonth).padStart(2, '0')}-${selectedReportYear}`
  const [payrollYears, setPayrollYears] = useState<number[]>([])

  const availableReportYears = useMemo(
    () => buildAvailableReportYears(payrollYears, expenses, sales, installments, paymentHistory, appointments),
    [payrollYears, expenses, sales, installments, paymentHistory, appointments],
  )

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const [expensesRes, employeesRes, monthlyRecordsRes, salesRes, installmentsRes, paymentHistoryRes, payrollMonthsRes, appointmentsRes] = await Promise.all([
        fetch("/api/expenses?scope=all", { cache: "no-store" }),
        fetch("/api/staff", { cache: "no-store" }),
        fetch(`/api/payroll?monthKey=${encodeURIComponent(reportMonthKey)}&includePaid=1`, { cache: "no-store" }),
        fetch("/api/sales?period=all", { cache: "no-store" }),
        fetch("/api/installments", { cache: "no-store" }),
        fetch("/api/installments/payment-history", { cache: "no-store" }),
        fetch("/api/payroll?getAvailableMonths=1", { cache: "no-store" }),
        fetch("/api/appointments?period=all", { cache: "no-store" }),
      ])

      if (expensesRes.ok) {
        const expenseData = await expensesRes.json()
        setExpenses(Array.isArray(expenseData) ? expenseData : [])
      }

      if (employeesRes.ok) {
        const employeeData = await employeesRes.json()
        setEmployees(Array.isArray(employeeData) ? employeeData : [])
      }

      if (monthlyRecordsRes.ok) {
        const payrollData = await monthlyRecordsRes.json()
        setMonthlyRecords(Array.isArray(payrollData) ? payrollData : [])
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(Array.isArray(salesData) ? salesData : [])
      }

      if (installmentsRes.ok) {
        const installmentData = await installmentsRes.json()
        setInstallments(Array.isArray(installmentData) ? installmentData : [])
      }

      if (paymentHistoryRes.ok) {
        const paymentHistoryData = await paymentHistoryRes.json()
        setPaymentHistory(Array.isArray(paymentHistoryData) ? paymentHistoryData : [])
      }

      if (payrollMonthsRes.ok) {
        const payrollMonths = await payrollMonthsRes.json()
        if (Array.isArray(payrollMonths)) {
          setPayrollYears(
            payrollMonths
              .map((m: { year?: number }) => Number(m.year))
              .filter((y: number) => Number.isFinite(y) && y >= MIN_REPORT_YEAR),
          )
        }
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : [])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      notifyActionError("هەڵە لە هێنانی داتا")
    } finally {
      setLoading(false)
    }
  }, [selectedReportYear, selectedReportMonth])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredExpenses = useMemo(
    () => expenses.filter((row) => matchesMonthYear(row.date, selectedReportYear, selectedReportMonth)),
    [expenses, selectedReportYear, selectedReportMonth],
  )

  const filteredEmployees = useMemo(
    () => employees,
    [employees],
  )

  // Calculate employee payroll data for the selected month
  const employeePayrollReports = useMemo(() => {
    return employees.map((employee) => {
      const basicSalary = parseFloat(employee.basicSalary || '0')
      const employeeAdvances = monthlyRecords.filter(
        (record) =>
          record.staffId === employee.id &&
          record.type === 'Advance'
      )
      const totalAdvances = employeeAdvances.reduce(
        (sum, record) => sum + parseFloat(record.amount || '0'),
        0
      )
      const remainingSalary = basicSalary - totalAdvances

      return {
        employee,
        basicSalary,
        advances: employeeAdvances,
        totalAdvances,
        remainingSalary,
      }
    })
  }, [employees, monthlyRecords])

  const filteredSales = useMemo(
    () => sales.filter((row) => matchesMonthYear(row.date, selectedReportYear, selectedReportMonth)),
    [sales, selectedReportYear, selectedReportMonth],
  )

  const filteredAppointments = useMemo(
    () => appointments.filter((row) => matchesMonthYear(row.appointmentDate, selectedReportYear, selectedReportMonth)),
    [appointments, selectedReportYear, selectedReportMonth],
  )

  const filteredInstallments = useMemo(
    () => installments.filter((row) => matchesMonthYear(row.createdAt, selectedReportYear, selectedReportMonth)),
    [installments, selectedReportYear, selectedReportMonth],
  )

  const filteredInstallmentsByPatient = useMemo(
    () => {
      let result = filteredInstallments
      if (selectedPatient !== "all") {
        result = result.filter(row => row.patientName === selectedPatient)
      }
      return result
    },
    [filteredInstallments, selectedPatient],
  )

  const uniquePatients = useMemo(
    () => Array.from(new Set(filteredInstallments.map(inst => inst.patientName))).sort(),
    [filteredInstallments],
  )

  const filteredPaymentHistory = useMemo(
    () => paymentHistory.filter((row) => matchesMonthYear(row.paymentDate, selectedReportYear, selectedReportMonth)),
    [paymentHistory, selectedReportYear, selectedReportMonth],
  )

  const expenseTotal = useMemo(
    () => filteredExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [filteredExpenses],
  )

  const employeesTotal = useMemo(() => {
    return employeePayrollReports.reduce((sum, report) => sum + report.remainingSalary, 0)
  }, [employeePayrollReports])

  const salesTotal = useMemo(
    () => filteredSales.reduce((sum, row) => sum + Number(row.profit || 0), 0),
    [filteredSales],
  )

  const appointmentsTotal = useMemo(
    () => filteredAppointments.reduce((sum, row) => sum + Number(row.money || 0), 0),
    [filteredAppointments],
  )

  const installmentsTotal = useMemo(
    () => filteredInstallments.reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0),
    [filteredInstallments],
  )

  const paymentHistoryTotal = useMemo(
    () => filteredPaymentHistory.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
    [filteredPaymentHistory],
  )

  const summaryTitle =
    activeReport === "expenses" ? "کۆی گشتی خەرجیەکان" :
    activeReport === "employees" ? "کۆی گشتی مووچەکان" :
    activeReport === "sales" ? "کۆی گشتی قازانج" :
    activeReport === "appointments" ? "کۆی گشتی داهات" :
    activeReport === "payment-history" ? "کۆی گشتی پارەدان" : "کۆی گشتی قیستەکان"

  const summaryTotalFormatted =
    activeReport === "appointments"
      ? formatAppointmentMoney(appointmentsTotal)
      : formatMoney(
          activeReport === "expenses" ? expenseTotal :
          activeReport === "employees" ? employeesTotal :
          activeReport === "sales" ? salesTotal :
          activeReport === "payment-history" ? paymentHistoryTotal :
          installmentsTotal,
        )

  const summaryCount =
    activeReport === "expenses" ? filteredExpenses.length :
    activeReport === "employees" ? employeePayrollReports.length :
    activeReport === "sales" ? filteredSales.length :
    activeReport === "appointments" ? filteredAppointments.length :
    activeReport === "payment-history" ? filteredPaymentHistory.length :
    filteredInstallments.length

  const onChangeReport = (nextReport: ReportType) => {
    router.push(`/dashboard/reports?type=${nextReport}`)
  }

  const printEmployee = async (employee: Employee) => {
    let iframe: HTMLIFrameElement | null = null
    try {
      const advanceTransactions = monthlyRecords.filter(
        (t) => t.staffId === employee.id && t.type === 'Advance',
      )
      const totalAdvance = advanceTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const remainingSalary = Number(employee.basicSalary) - totalAdvance

      const advanceRowsHtml = advanceTransactions.length > 0
        ? advanceTransactions.map((t, i) => `
            <tr>
              <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${i + 1}</td>
              <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(t.date)}</td>
              <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(t.amount)}</td>
              <td style="border:1px solid #d1d5db;padding:8px;">${t.note || '-'}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="4" style="border:1px solid #d1d5db;padding:8px;text-align:center;">هیچ پێشەکییەک تۆمار نەکراوە</td></tr>`

      const employeeHtml = `
        <div id="pdf-employee" style="direction:rtl;font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:20px;width:900px;">
          <h1 style="margin:0 0 6px 0;text-align:center;font-size:24px;color:#0f172a;">شا سیستەم - زانیاری کارمەند</h1>
          <p style="margin:0 0 20px 0;text-align:center;color:#475569;font-size:14px;">بەرواری پرێنت: ${new Date().toLocaleDateString("ku-IQ")}</p>
          <p style="margin:0 0 20px 0;text-align:center;color:#475569;font-size:14px;">مانگ و ساڵی راپۆرت: ${reportPeriodLabel}</p>
          
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری کەسی</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">ناوی تەواو:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${employee.fullName}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">پلە:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${employee.role}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ژمارە تەلەفۆن:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${employee.phonenumber}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">تەمەن:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${employee.age || '-'}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ناونیشان:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${employee.address || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری مووچە</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">مووچەی بنەڕەت:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(employee.basicSalary)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">کۆی پێشەکییەکان:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${totalAdvance > 0 ? formatMoney(totalAdvance) : '0 د.ع'}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی ماوەی مووچە:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(remainingSalary)}</td>
              </tr>
            </tbody>
          </table>
          
          <h3 style="margin:20px 0 10px 0;font-size:16px;font-weight:bold;text-align:center;">لیستی پێشەکییەکان</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">#</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بەروار</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بڕی پارە</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">تێبینی</th>
              </tr>
            </thead>
            <tbody>
              ${advanceRowsHtml}
            </tbody>
          </table>
          
          <div style="margin-top:40px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:20px;">
            <p>ئەم راپۆرتە لەلایەن شا سیستەم دروستکراوە</p>
          </div>
        </div>
      `

      iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) {
        throw new Error("iframe document is not available")
      }

      iframeDoc.open()
      iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">${employeeHtml}</body></html>`)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 120))

      const reportElement = iframeDoc.getElementById("pdf-employee")
      if (!reportElement) {
        throw new Error("report element is missing")
      }

      const canvas = await html2canvas(reportElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      })

      const image = canvas.toDataURL("image/jpeg", 0.95)
      const doc = new jsPDF("p", "mm", "a4")

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 10
      const width = pageWidth - margin * 2
      const ratio = width / canvas.width
      const imageHeight = canvas.height * ratio

      let remaining = imageHeight
      let y = margin

      doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
      remaining -= pageHeight - margin * 2

      while (remaining > 0) {
        doc.addPage()
        y = margin - (imageHeight - remaining)
        doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
        remaining -= pageHeight - margin * 2
      }

      const fileName = `employee-${employee.fullName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      notifyPdfExported("PDF ڕاپۆرت")
    } catch (error) {
      console.error("PDF export error:", error)
      const errorMessage = error instanceof Error ? error.message : "unknown"
      notifyPdfError(`هەڵە لە دروستکردنی PDF: ${errorMessage}`)
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }
  }

  const printPatient = async (installment: Installment) => {
    let iframe: HTMLIFrameElement | null = null
    try {
      const totalAmount = Number(installment.totalAmount || 0)
      const paidAmount = Number(installment.paidAmount || 0)
      const remainingAmount = Number(installment.remainingAmount || 0)

      // Calculate initial payment (the amount paid when installment was created)
      const historyTotal = installment.paymentHistory?.reduce((sum, ph) => sum + Number(ph.amountPaid || 0), 0) || 0
      const initialPayment = Math.max(0, paidAmount - historyTotal)

      let paymentRows: string[] = []

      // Add initial payment row if exists
      if (initialPayment > 0) {
        paymentRows.push(`
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">1</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${installment.createdAt ? formatDate(installment.createdAt) : '-'}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(initialPayment)}</td>
          </tr>
        `)
      }

      // Add recorded payment history rows
      if (installment.paymentHistory && installment.paymentHistory.length > 0) {
        paymentRows.push(...installment.paymentHistory.map((ph, i) => `
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${initialPayment > 0 ? i + 2 : i + 1}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(ph.paymentDate)}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(ph.amountPaid)}</td>
          </tr>
        `))
      }

      const paymentRowsHtml = paymentRows.length > 0
        ? paymentRows.join('')
        : `<tr><td colspan="3" style="border:1px solid #d1d5db;padding:8px;text-align:center;">هیچ پارەدانێک تۆمار نەکراوە</td></tr>`

      const patientHtml = `
        <div id="pdf-patient" style="direction:rtl;font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:20px;width:900px;">
          <h1 style="margin:0 0 6px 0;text-align:center;font-size:24px;color:#0f172a;">شا سیستەم - زانیاری قیستی نەخۆش</h1>
          <p style="margin:0 0 20px 0;text-align:center;color:#475569;font-size:14px;">بەرواری پرێنت: ${new Date().toLocaleDateString("ku-IQ")}</p>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری نەخۆش</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">ناوی نەخۆش:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.patientName}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">تەمەن:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.age || '-'}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ژمارە تەلەفۆن:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.phoneNumber || '-'}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ناونیشان:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.address || '-'}</td>
              </tr>
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری قیست</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">کۆی گشتی:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(totalAmount)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی دراو:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(paidAmount)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی ماوە:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(remainingAmount)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بەرواری داهاتوو:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.nextPaymentDate ? new Date(installment.nextPaymentDate).toLocaleDateString('ku-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بەرواری کۆتایی پارەدان:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.paymentHistory && installment.paymentHistory.length > 0 ? formatDate(installment.paymentHistory[installment.paymentHistory.length - 1].paymentDate) : '-'}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="margin:20px 0 10px 0;font-size:16px;font-weight:bold;text-align:center;">لیستی پارەدانەکان</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">#</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بەروار</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بڕی پارە</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRowsHtml}
            </tbody>
          </table>

          <div style="margin-top:40px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:20px;">
            <p>ئەم راپۆرتە لەلایەن شا سیستەم دروستکراوە</p>
          </div>
        </div>
      `

      iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) {
        throw new Error("iframe document is not available")
      }

      iframeDoc.open()
      iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">${patientHtml}</body></html>`)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 120))

      const reportElement = iframeDoc.getElementById("pdf-patient")
      if (!reportElement) {
        throw new Error("report element is missing")
      }

      const canvas = await html2canvas(reportElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      })

      const image = canvas.toDataURL("image/jpeg", 0.95)
      const doc = new jsPDF("p", "mm", "a4")

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 10
      const width = pageWidth - margin * 2
      const ratio = width / canvas.width
      const imageHeight = canvas.height * ratio

      let remaining = imageHeight
      let y = margin

      doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
      remaining -= pageHeight - margin * 2

      while (remaining > 0) {
        doc.addPage()
        y = margin - (imageHeight - remaining)
        doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
        remaining -= pageHeight - margin * 2
      }

      const fileName = `patient-${installment.patientName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      notifyPdfExported("PDF ڕاپۆرت")
    } catch (error) {
      console.error("PDF export error:", error)
      const errorMessage = error instanceof Error ? error.message : "unknown"
      notifyPdfError(`هەڵە لە دروستکردنی PDF: ${errorMessage}`)
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }
  }

  const syncPaymentAmounts = async () => {
    if (!selectedInstallment) return;
    setSyncingPayment(true);
    try {
      const response = await fetch('/api/installments/sync-payment-amounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installmentId: selectedInstallment.id }),
      });
      if (response.ok) {
        notifyPaymentAmountSynced();
        await fetchReports();
        setPaymentHistoryModalOpen(false);
      } else {
        notifyActionError('هەڵە لە ڕێکخستنی بڕی دراو');
      }
    } catch (error) {
      notifyActionError('هەڵەیەک ڕویدا');
    } finally {
      setSyncingPayment(false);
    }
  };

  const savePdf = async () => {
    let iframe: HTMLIFrameElement | null = null
    setExporting(true)
    try {
      const pdfExpenses = filteredExpenses
      const pdfSales = filteredSales
      const pdfInstallments = filteredInstallments
      const pdfPaymentHistory = filteredPaymentHistory
      const pdfAppointments = filteredAppointments

      const rowCount =
        activeReport === "expenses" ? pdfExpenses.length :
        activeReport === "employees" ? employeePayrollReports.length :
        activeReport === "sales" ? pdfSales.length :
        activeReport === "appointments" ? pdfAppointments.length :
        activeReport === "payment-history" ? pdfPaymentHistory.length :
        pdfInstallments.length

      if (rowCount === 0) {
        notifyActionError("هیچ داتایەک نییە بۆ دروستکردنی PDF", "PDF")
        return
      }

      const monthYearStr = reportMonthKey

      const reportTitle =
        activeReport === "expenses"
          ? "   شا سیستەم - ڕاپۆرتی خەرجیەکان"
          : activeReport === "employees"
          ? "شا سیستەم - ڕاپۆرتی کارمەندەکان"
          : activeReport === "sales"
          ? "شا سیستەم - ڕاپۆرتی فرۆشتن"
          : activeReport === "appointments"
          ? "شا سیستەم - ڕاپۆرتی سەرەبڕین"
          : activeReport === "payment-history"
          ? "شا سیستەم - مێژووی پارەدان"
          : "شا سیستەم - ڕاپۆرتی قیسەکان"

      const total = activeReport === "expenses" ? pdfExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0) : activeReport === "employees" ? employeePayrollReports.reduce((sum, report) => sum + report.remainingSalary, 0) : activeReport === "sales" ? pdfSales.reduce((sum, row) => sum + Number(row.profit || 0), 0) : activeReport === "appointments" ? pdfAppointments.reduce((sum, row) => sum + Number(row.money || 0), 0) : activeReport === "payment-history" ? pdfPaymentHistory.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0) : pdfInstallments.reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0)

      const rowsHtml =
        activeReport === "expenses"
          ? pdfExpenses
              .map(
                (item, index) => `
                  <tr>
                    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${index + 1}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(item.date)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.title}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.category}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.paymentMethod}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(item.amount)}</td>
                  </tr>
                `,
              )
              .join("")
          : activeReport === "employees"
          ? employeePayrollReports
              .map(
                (report, index) => `
                  <tr>
                    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${index + 1}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${report.employee.fullName}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${report.employee.role}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${report.employee.phonenumber}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(report.basicSalary)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(report.totalAdvances)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${report.employee.address || '-'}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(report.remainingSalary)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${monthYearStr}</td>
                  </tr>
                `,
              )
              .join("")
          : activeReport === "sales"
          ? pdfSales
              .map(
                (item, index) => `
                  <tr>
                    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${index + 1}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(item.date)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.productName}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.category}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(item.price)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.quantity}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(item.totalPrice)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(item.profit)}</td>
                  </tr>
                `,
              )
              .join("")
          : activeReport === "appointments"
          ? pdfAppointments
              .map(
                (item, index) => `
                  <tr>
                    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${index + 1}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(item.appointmentDate)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.name}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.gender}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.phone}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.age}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.treatmentType}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatAppointmentMoney(item.money || 0)}</td>
                  </tr>
                `,
              )
              .join("")
          : activeReport === "payment-history"
          ? pdfPaymentHistory
              .map(
                (item, index) => `
                  <tr>
                    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${index + 1}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(item.paymentDate)}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.patientName}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${item.installmentNumber ? `قیست ${item.installmentNumber}` : '-'}</td>
                    <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(item.amountPaid)}</td>
                  </tr>
                `,
              )
              .join("")
          : ''

      let paymentHistoryTableHtml = ''
      if (activeReport === "installments") {
        paymentHistoryTableHtml = filteredInstallmentsByPatient.map((item, index) => {
          const totalAmount = Number(item.totalAmount || 0)
          const paidAmount = Number(item.paidAmount || 0)
          const remainingAmount = Number(item.remainingAmount || 0)

          // Calculate initial payment (the amount paid when installment was created)
          const historyTotal = item.paymentHistory?.reduce((sum, ph) => sum + Number(ph.amountPaid || 0), 0) || 0
          const initialPayment = Math.max(0, paidAmount - historyTotal)

          let paymentRows: string[] = []

          // Add initial payment row if exists
          if (initialPayment > 0) {
            paymentRows.push(`
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">1</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${item.createdAt ? formatDate(item.createdAt) : '-'}</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(initialPayment)}</td>
              </tr>
            `)
          }

          // Add recorded payment history rows
          if (item.paymentHistory && item.paymentHistory.length > 0) {
            paymentRows.push(...item.paymentHistory.map((ph, i) => `
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${initialPayment > 0 ? i + 2 : i + 1}</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(ph.paymentDate)}</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(ph.amountPaid)}</td>
              </tr>
            `))
          }

          const paymentRowsHtml = paymentRows.length > 0
            ? paymentRows.join('')
            : `<tr><td colspan="3" style="border:1px solid #d1d5db;padding:8px;text-align:center;">هیچ پارەدانێک تۆمار نەکراوە</td></tr>`

          return `
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:40px;">
              <tr>
                <td style="padding:0;">
                  <h3 style="margin:0 0 20px 0;font-size:18px;font-weight:bold;color:#0f172a;border-bottom:2px solid #9ca3af;padding-bottom:10px;">نەخۆش #${index + 1}: ${item.patientName}</h3>

                  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                    <thead>
                      <tr>
                        <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری نەخۆش</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">ناوی نەخۆش:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${item.patientName}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">تەمەن:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${item.age || '-'}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ژمارە تەلەفۆن:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${item.phoneNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">ناونیشان:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${item.address || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                    <thead>
                      <tr>
                        <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری قیست</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">کۆی گشتی:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(totalAmount)}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی دراو:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(paidAmount)}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی ماوە:</td>
                        <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(remainingAmount)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style="margin:20px 0 10px 0;font-size:16px;font-weight:bold;text-align:center;">لیستی پارەدانەکان</h4>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                      <tr>
                        <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">#</th>
                        <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بەروار</th>
                        <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بڕی پارە</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${paymentRowsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          `
        }).join('')
      }

      const reportHtml = `
        <div id="pdf-report" style="direction:rtl;font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:20px;width:900px;">
          <h1 style="margin:0 0 6px 0;text-align:center;font-size:24px;">${reportTitle}</h1>
          <p style="margin:0 0 6px 0;text-align:center;color:#475569;font-size:15px;font-weight:700;">مانگ و ساڵی راپۆرت: ${reportPeriodLabel}</p>
          <p style="margin:0 0 14px 0;text-align:center;color:#475569;">بەرواری دروستکردن: ${new Date().toLocaleDateString("en-CA")}</p>
          ${activeReport !== "installments" ? `<p style="margin:0 0 14px 0;font-weight:700;">کۆی گشتی: ${activeReport === "appointments" ? formatAppointmentMoney(total) : formatMoney(total)}</p>` : ''}

          ${activeReport === "installments" ? `
            ${paymentHistoryTableHtml}
          ` : `
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr>
                  ${activeReport === "employees" ? '' : '<th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">#</th>'}
                  ${activeReport === "employees" ? '' : '<th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">بەروار</th>'}
                  ${activeReport === "expenses" ? `
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناونیشان</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">جۆر</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">شێوازی پارەدان</th>
                  ` : activeReport === "employees" ? `
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">#</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناوی کارمەند</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">پلە</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ژمارە تەلەفۆن</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">مووچەی بنەڕەتی</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">کۆی پێشەکییەکان</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناونیشان</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">بڕی ماوەی مووچە</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">مانگ</th>
                  ` : activeReport === "sales" ? `
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناوی کاڵا</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">پۆل</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">نرخی فرۆشتن</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">بڕی فرۆشتن</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">کۆی فرۆشتن</th>
                  ` : activeReport === "appointments" ? `
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناوی نەخۆش</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ڕەگەز</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">تەلەفۆن</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">تەمەن</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">جۆری چارەسەری</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">بڕی پارە</th>
                  ` : activeReport === "payment-history" ? `
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ناوی نەخۆش</th>
                    <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">ژمارەی قیست</th>
                  ` : ''}
                  ${activeReport === "payment-history" ? `<th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">بڕی پارە</th>` : ''}
                  ${activeReport === "sales" ? `<th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;">قازانج</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          `}
        </div>
      `

      iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) {
        throw new Error("iframe document is not available")
      }

      iframeDoc.open()
      iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">${reportHtml}</body></html>`)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 120))

      const reportElement = iframeDoc.getElementById("pdf-report")
      if (!reportElement) {
        throw new Error("report element is missing")
      }

      const canvas = await html2canvas(reportElement, {
        backgroundColor: "#ffffff",
        scale: 1.4,
        useCORS: true,
        logging: false,
      })

      const image = canvas.toDataURL("image/jpeg", 0.72)
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 10
      const width = pageWidth - margin * 2
      const ratio = width / canvas.width
      const imageHeight = canvas.height * ratio

      let remaining = imageHeight
      let y = margin

      doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
      remaining -= pageHeight - margin * 2

      while (remaining > 0) {
        doc.addPage()
        y = margin - (imageHeight - remaining)
        doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
        remaining -= pageHeight - margin * 2
      }

      const fileName =
        activeReport === "expenses"
          ? `expense-report-${reportMonthKey}.pdf`
          : activeReport === "employees"
          ? `employees-report-${reportMonthKey}.pdf`
          : activeReport === "sales"
          ? `sales-report-${reportMonthKey}.pdf`
          : activeReport === "appointments"
          ? `appointments-report-${reportMonthKey}.pdf`
          : activeReport === "payment-history"
          ? `payment-history-report-${reportMonthKey}.pdf`
          : `installments-report-${reportMonthKey}.pdf`

      doc.save(fileName)
      notifyPdfExported("PDF ڕاپۆرت")
    } catch (error) {
      console.error("PDF export error:", error)
      const errorMessage = error instanceof Error ? error.message : "unknown"
      notifyPdfError(`هەڵە لە دروستکردنی PDF: ${errorMessage}`)
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
      setExporting(false)
    }
  }

  return (
    <DashboardPageShell>
      <div className={mobileInset}>
        <h1 className="text-lg sm:text-2xl font-semibold text-foreground">ڕاپۆرتەکان</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          راپۆرتی ئێستا: <span className="font-semibold text-foreground">{reportPeriodLabel}</span>
        </p>
      </div>

      {/* Mobile layout */}
      <div className={`md:hidden space-y-3 ${mobileInset}`}>
        <div className="rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50 dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
              <Wallet className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              کۆی گشتی
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">{summaryTitle}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryTotalFormatted}</p>
          <div className="flex items-center justify-between mt-3 p-2 rounded-lg bg-white/60 dark:bg-slate-800">
            <span className="text-xs text-muted-foreground">تۆمار</span>
            <span className="text-sm font-semibold">{summaryCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {reportTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeReport === tab.key
            return (
              <Button
                key={tab.key}
                onClick={() => onChangeReport(tab.key)}
                variant={isActive ? "default" : "outline"}
                className={`h-10 justify-center gap-1.5 text-xs font-semibold ${
                  isActive
                    ? "bg-[#2ea7b8] hover:bg-[#2496a6] text-white border-[#2ea7b8]"
                    : "border-border/80"
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.shortLabel}
              </Button>
            )
          })}
        </div>

        <div className="rounded-xl border border-border/40 bg-slate-50 dark:bg-slate-900 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">مانگ و ساڵی راپۆرت</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={String(selectedReportMonth)} onValueChange={(val) => setSelectedReportMonth(parseInt(val))}>
              <SelectTrigger className="w-full h-10 text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KURDISH_MONTHS.map((monthName, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{monthName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedReportYear)}
              onValueChange={(val) => setSelectedReportYear(Math.max(MIN_REPORT_YEAR, parseInt(val)))}
            >
              <SelectTrigger className="w-full h-10 text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableReportYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="block text-center text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
            {reportPeriodLabel}
          </span>
        </div>

        <Button
          onClick={savePdf}
          disabled={exporting || loading}
          className="w-full h-10 bg-[#3dc1d3] hover:bg-[#35aebb] text-sm font-semibold"
        >
          <FileText className="h-4 w-4" />
          {exporting ? "ئامادەکردنی PDF..." : "پرێنت / PDF"}
        </Button>
      </div>

      {/* Desktop layout */}
      <div className={`hidden md:grid md:grid-cols-3 gap-4 ${mobileInset}`}>
        <div className="relative group md:col-span-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2ea7b8] to-[#3dc1d3] opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-[#e0f7fa] dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-[#2ea7b8] dark:hover:border-slate-600 h-full">
              <div className="flex items-start justify-between mb-3 sm:mb-6">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-[#2ea7b8] to-[#3dc1d3] rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="size-4 sm:size-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-[#b2ebf2] dark:bg-[#2ea7b8]/30 text-[#2ea7b8] dark:text-[#3dc1d3]">
                  ڕاپۆرت
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">دەتوانی ڕاپۆرتی هەموو بەشەکان ببینی لەم بەشە و پرێنت بکەیت</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {reportTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.key}
                      onClick={() => onChangeReport(tab.key)}
                      variant={activeReport === tab.key ? "default" : "outline"}
                      className="justify-start gap-2 bg-[#2ea7b8] hover:bg-[#2496a6] text-white border-[#2ea7b8]"
                    >
                      <Icon className="size-4" />
                      {tab.shortLabel}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-red-50 dark:bg-slate-900 rounded-2xl p-9 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-red-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wallet className="size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                کۆی گشتی
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{summaryTitle}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{summaryTotalFormatted}</h3>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">تۆمار</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{summaryCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`hidden md:flex items-center gap-2 overflow-x-auto pb-2 ${mobileInset}`}>
        {reportTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.key}
              variant={activeReport === tab.key ? "default" : "outline"}
              className={activeReport === tab.key ? "bg-[#3dc1d3] hover:bg-[#35aebb]" : "whitespace-nowrap"}
              onClick={() => onChangeReport(tab.key)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      <div className={`hidden md:block space-y-4 ${mobileInset}`}>
        <div className="flex flex-wrap items-center gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/40">
          <label className="text-sm font-semibold text-foreground">مانگ و ساڵی راپۆرت:</label>
          <Select value={String(selectedReportMonth)} onValueChange={(val) => setSelectedReportMonth(parseInt(val))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KURDISH_MONTHS.map((monthName, i) => {
                const monthNum = i + 1
                return <SelectItem key={monthNum} value={String(monthNum)}>{monthName}</SelectItem>
              })}
            </SelectContent>
          </Select>

          <Select
            value={String(selectedReportYear)}
            onValueChange={(val) => setSelectedReportYear(Math.max(MIN_REPORT_YEAR, parseInt(val)))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableReportYears.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
            {reportPeriodLabel}
          </span>
        </div>

        <div className="flex justify-start">
          <Button onClick={savePdf} disabled={exporting || loading} className="bg-[#3dc1d3] hover:bg-[#35aebb]">
            <FileText className="h-4 w-4" />
            {exporting ? "ئامادەکردنی PDF..." : " پرێنت / pdf"}
          </Button>
        </div>
      </div>

      <div>
      {activeReport === "expenses" ? (
        <div className={mobileTableShell}>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>#</TableHead>
                <TableHead className={mobileTh}>بەروار</TableHead>
                <TableHead className={mobileTh}>ناونیشان</TableHead>
                <TableHead className={mobileTh}>جۆر</TableHead>
                <TableHead className={mobileTh}>شێوازی پارەدان</TableHead>
                <TableHead className={mobileTh}>بڕی پارە</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ خەرجییەک تۆمار نەکراوە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <TableRow
                    key={expense.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-primary/2 dark:bg-slate-900/30"
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className={mobileTd}>{index + 1}</TableCell>
                    <TableCell className={mobileTd}>{formatDate(expense.date)}</TableCell>
                    <TableCell className={mobileTdPrimary}>{expense.title}</TableCell>
                    <TableCell className={mobileTd}>{expense.category}</TableCell>
                    <TableCell className={mobileTd}>{expense.paymentMethod}</TableCell>
                    <TableCell>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        {formatMoney(expense.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}

      {activeReport === "employees" ? (
        <div className={mobileTableShell}>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>ناوی کارمەند</TableHead>
                <TableHead className={mobileTh}>پلە</TableHead>
                <TableHead className={mobileTh}>ژمارە تەلەفۆن</TableHead>
                <TableHead className={mobileTh}>مووچەی بنەڕەتی</TableHead>
                <TableHead className={mobileTh}>کۆی پێشەکییەکان</TableHead>
                <TableHead className={mobileTh}>ناونیشان</TableHead>
                <TableHead className={mobileTh}>بڕی ماوەی مووچە</TableHead>
                <TableHead className={mobileTh}>مانگ</TableHead>
                <TableHead className={mobileTh}>پرێنت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : employeePayrollReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ کارمەندێک تۆمار نەکراوە.
                  </TableCell>
                </TableRow>
              ) : employeePayrollReports.map((report, index) => (
                <TableRow
                  key={report.employee.id}
                  className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0 
                      ? 'bg-white dark:bg-slate-950' 
                      : 'bg-primary/2 dark:bg-slate-900/30'
                  } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                >
                  <TableCell className={mobileTdPrimary}>
                    {report.employee.fullName}
                  </TableCell>
                  <TableCell className={mobileTd}>{report.employee.role}</TableCell>
                  <TableCell className={mobileTd}>{report.employee.phonenumber}</TableCell>
                  <TableCell className="text-foreground/70">
                    <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      {formatMoney(report.basicSalary)}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      {formatMoney(report.totalAdvances)}
                    </span>
                  </TableCell>
                  <TableCell className={mobileTd}>
                    {report.employee.address || '-'}
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      {formatMoney(report.remainingSalary)}
                    </span>
                  </TableCell>
                  <TableCell className={mobileTd}>
                    {reportPeriodLabel}
                  </TableCell>
                  <TableCell className={mobileTd}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => printEmployee(report.employee)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}

      {activeReport === "installments" ? (
        <div className={mobileTableShell}>
          <div className="p-3 sm:p-4 border-b border-border/40 bg-primary/5">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-foreground">فلتەری نەخۆش:</label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="هەموو نەخۆشەکان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">هەموو نەخۆشەکان</SelectItem>
                  {uniquePatients.map(patient => (
                    <SelectItem key={patient} value={patient}>{patient}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>#</TableHead>
                <TableHead className={mobileTh}>بەروار</TableHead>
                <TableHead className={mobileTh}>ناوی نەخۆش</TableHead>
                <TableHead className={mobileTh}>کۆی گشتی</TableHead>
                <TableHead className={mobileTh}>بڕی دراو</TableHead>
                <TableHead className={mobileTh}>بڕی ماوە</TableHead>
                <TableHead className={mobileTh}>قیستی مانگانە</TableHead>
                <TableHead className={mobileTh}>بەرواری پارەدان</TableHead>
                <TableHead className={mobileTh}>بەرواری داهاتوو</TableHead>
                <TableHead className={mobileTh}>بارودۆخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : filteredInstallmentsByPatient.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ داتایەکی قیسە بەردەست نییە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstallmentsByPatient.map((item, index) => {
                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case 'Paid': return 'دراوە'
                      case 'Pending': return 'چاوەڕوانکراوە'
                      case 'Overdue': return 'دواکەوتووە'
                      default: return status
                    }
                  }
                  return (
                    <TableRow
                      key={item.id}
                      className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-950"
                          : "bg-primary/2 dark:bg-slate-900/30"
                      } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                    >
                      <TableCell className={mobileTd}>{index + 1}</TableCell>
                      <TableCell className={mobileTd}>{formatDate(item.createdAt)}</TableCell>
                      <TableCell className={mobileTdPrimary}>{item.patientName}</TableCell>
                      <TableCell className={mobileTd}>{formatMoney(item.totalAmount)}</TableCell>
                      <TableCell className={mobileTd}>{formatMoney(item.paidAmount)}</TableCell>
                      <TableCell className={mobileTd}>{formatMoney(item.remainingAmount)}</TableCell>
                      <TableCell className={mobileTd}>{formatMoney(item.installmentValue)}</TableCell>
                      <TableCell className={mobileTd}>
                        {item.paymentHistory && item.paymentHistory.length > 0 ? (
                          <div className="flex items-center gap-2">
                         
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedInstallment(item)
                                setPaymentHistoryModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {item.paymentHistory.length} پارەدان
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className={mobileTd}>{item.nextPaymentDate ? formatDate(item.nextPaymentDate) : '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl px-2 py-0.5 text-xs font-semibold ${
                          item.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}

      <Dialog open={paymentHistoryModalOpen} onOpenChange={setPaymentHistoryModalOpen}>
        <DialogContent className={mobileDialogContentWide} dir="rtl">
          <DialogHeader>
            <DialogTitle>مێژووی پارەدان - {selectedInstallment?.patientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInstallment && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">کۆی گشتی</p>
                    <p className="text-lg font-semibold">{formatMoney(selectedInstallment.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">بڕی پارەی ماوە</p>
                    <p className="text-lg font-semibold">{formatMoney(selectedInstallment.remainingAmount)}</p>
                  </div>
                </div>
                {selectedInstallment.paymentHistory && selectedInstallment.paymentHistory.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">بڕی دراو (لە مێژووی پارەدان):</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatMoney(
                            selectedInstallment.paymentHistory.reduce((sum, ph) => sum + parseFloat(ph.amountPaid || '0'), 0).toString()
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={syncPaymentAmounts}
                        disabled={syncingPayment}
                        className="h-8"
                      >
                        {syncingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        <span className="mr-2">ڕێکخستن</span>
                      </Button>
                    </div>
                  </div>
                )}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                      
                        <TableHead className="text-right">بەرواری پارەدان</TableHead>
                        <TableHead className="text-right">بڕی پارەی دراو</TableHead>
                          <TableHead className="text-right">#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInstallment.paymentHistory && selectedInstallment.paymentHistory.length > 0 ? (
                        selectedInstallment.paymentHistory.map((ph, index) => (
                          <TableRow key={index}>
                           
                            <TableCell className="text-right">{formatDate(ph.paymentDate)}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">{formatMoney(ph.amountPaid)}</TableCell>
                             <TableCell className="text-right">{index + 1}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            هیچ پارەدانێک تۆمار نەکراوە
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {activeReport === "sales" ? (
        <div className={mobileTableShell}>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>#</TableHead>
                <TableHead className={mobileTh}>بەروار</TableHead>
                <TableHead className={mobileTh}>ناوی کاڵا</TableHead>
                <TableHead className={mobileTh}>پۆل</TableHead>
                <TableHead className={mobileTh}>نرخی فرۆشتن</TableHead>
                <TableHead className={mobileTh}>بڕی فرۆشتن</TableHead>
                <TableHead className={mobileTh}>کۆی فرۆشتن</TableHead>
                <TableHead className={mobileTh}>قازانج</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ فرۆشتنێک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale, index) => (
                  <TableRow
                    key={sale.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-primary/2 dark:bg-slate-900/30"
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className={mobileTd}>{index + 1}</TableCell>
                    <TableCell className={mobileTd}>{formatDate(sale.date)}</TableCell>
                    <TableCell className={mobileTdPrimary}>{sale.productName}</TableCell>
                    <TableCell className={mobileTd}>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {sale.category}
                      </span>
                    </TableCell>
                    <TableCell className={mobileTd}>{formatMoney(sale.price)}</TableCell>
                    <TableCell className={mobileTd}>{sale.quantity}</TableCell>
                    <TableCell className={mobileTd}>{formatMoney(sale.totalPrice)}</TableCell>
                    <TableCell className={mobileTd}>
                      <span className={`inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl px-2 py-0.5 text-xs font-semibold ${
                        sale.profit >= 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {formatMoney(sale.profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}

      {activeReport === "appointments" ? (
        <div className={mobileTableShell}>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>#</TableHead>
                <TableHead className={mobileTh}>بەروار</TableHead>
                <TableHead className={mobileTh}>ناوی نەخۆش</TableHead>
                <TableHead className={mobileTh}>ڕەگەز</TableHead>
                <TableHead className={mobileTh}>تەلەفۆن</TableHead>
                <TableHead className={mobileTh}>تەمەن</TableHead>
                <TableHead className={mobileTh}>جۆری چارەسەری</TableHead>
                <TableHead className={mobileTh}>بڕی پارە</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ نەخۆشێک تۆمار نەکراوە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment, index) => (
                  <TableRow
                    key={appointment.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-primary/2 dark:bg-slate-900/30"
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className={mobileTd}>{index + 1}</TableCell>
                    <TableCell className={mobileTd}>{formatDate(appointment.appointmentDate)}</TableCell>
                    <TableCell className={mobileTdPrimary}>{appointment.name}</TableCell>
                    <TableCell className={mobileTd}>{appointment.gender}</TableCell>
                    <TableCell className={mobileTd}>{appointment.phone}</TableCell>
                    <TableCell className={mobileTd}>{appointment.age}</TableCell>
                    <TableCell className={mobileTd}>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {appointment.treatmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {appointment.money ? (
                        <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          {formatAppointmentMoney(appointment.money)}
                        </span>
                      ) : (
                        <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}

      {activeReport === "payment-history" ? (
        <div className={mobileTableShell}>
          <div className={mobileTableScroll}>
            <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>#</TableHead>
                <TableHead className={mobileTh}>بەرواری پارەدان</TableHead>
                <TableHead className={mobileTh}>ناوی نەخۆش</TableHead>
                <TableHead className={mobileTh}>ژمارەی قیست</TableHead>
                <TableHead className={mobileTh}>بڕی پارە</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ...چاوەڕوانبە
                  </TableCell>
                </TableRow>
              ) : filteredPaymentHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ داتایەکی پارەدان بەردەست نییە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPaymentHistory.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-primary/2 dark:bg-slate-900/30"
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className={mobileTd}>{index + 1}</TableCell>
                    <TableCell className={mobileTd}>{formatDate(item.paymentDate)}</TableCell>
                    <TableCell className={mobileTdPrimary}>{item.patientName}</TableCell>
                    <TableCell className={mobileTd}>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.installmentNumber ? `قیست ${item.installmentNumber}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        {formatMoney(item.amountPaid)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : null}
      </div>
    </DashboardPageShell>
  )
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center text-sm text-muted-foreground" dir="rtl">
          ...چاوەڕوانبە
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  )
}
