"""
CyberTrace AI - Realistic Police/Law Enforcement Document Generator
Generates the following documents:
1. FIR (First Information Report) - Cyber Crime Wing PDF
2. Bank Account Statement - HDFC Bank PDF
3. Cyber Crime Complaint Form - NCRP Portal PDF
4. Transaction Freeze Request Letter PDF
5. bank_transactions.csv - Machine-readable transaction log for bulk import
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta
import csv
import random
import string
import io

# ── Output Directory ─────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_documents")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT 1: First Information Report (FIR) - Cyber Crime Wing
# ══════════════════════════════════════════════════════════════════════════════
def generate_fir():
    path = os.path.join(OUTPUT_DIR, "FIR_CyberCrime_CCB_2026_0023.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=1.5*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                  alignment=TA_CENTER, fontSize=14, spaceAfter=2,
                                  textColor=colors.darkblue)
    subheader_style = ParagraphStyle('SubHeader', parent=styles['Heading2'],
                                     alignment=TA_CENTER, fontSize=11, spaceAfter=6)
    label_style = ParagraphStyle('Label', parent=styles['Normal'],
                                 fontSize=9, textColor=colors.grey)
    value_style = ParagraphStyle('Value', parent=styles['Normal'],
                                 fontSize=10, fontName='Helvetica-Bold')
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                fontSize=9.5, leading=15, spaceAfter=4,
                                alignment=TA_JUSTIFY)
    section_style = ParagraphStyle('Section', parent=styles['Heading3'],
                                   fontSize=10, textColor=colors.darkblue,
                                   spaceAfter=4, spaceBefore=8, fontName='Helvetica-Bold')

    story = []

    # ── Letterhead ────────────────────────────────────────────────────────────
    story.append(Paragraph("GOVERNMENT OF INDIA", header_style))
    story.append(Paragraph("MINISTRY OF HOME AFFAIRS — CYBER CRIME COORDINATION CENTRE", subheader_style))
    story.append(Paragraph("Cyber Crime Police Station, Sector 14, Gurugram, Haryana — 122001", subheader_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.darkblue))
    story.append(Spacer(1, 4*mm))

    # ── FIR Heading ───────────────────────────────────────────────────────────
    story.append(Paragraph("FIRST INFORMATION REPORT (FIR)", ParagraphStyle('FirTitle', parent=styles['Heading1'],
                            alignment=TA_CENTER, fontSize=16, textColor=colors.HexColor('#1a1a6e'))))
    story.append(Paragraph("Under Section 154 CrPC", ParagraphStyle('CrPC', parent=styles['Normal'],
                            alignment=TA_CENTER, fontSize=9, textColor=colors.grey)))
    story.append(Spacer(1, 4*mm))

    # ── FIR Metadata Table ────────────────────────────────────────────────────
    meta_data = [
        ["FIR No.:", "CCB/2026/CYB/0023", "Date of Registration:", "11-07-2026"],
        ["Police Station:", "Cyber Crime PS, Gurugram", "Time of Registration:", "14:32 HRS"],
        ["District:", "Gurugram, Haryana", "Type of Crime:", "Cyber Fraud / Online Cheating"],
        ["IPC Sections:", "420, 465, 468, 471 IPC", "IT Act Sections:", "66C, 66D IT Act 2000"],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*cm, 6.5*cm, 4*cm, 4*cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f4ff')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 5*mm))

    # ── Complainant Details ────────────────────────────────────────────────────
    story.append(Paragraph("A. COMPLAINANT DETAILS", section_style))
    comp_data = [
        ["Name:", "Rajesh Kumar Sharma"],
        ["Father's Name:", "Shri Mohan Lal Sharma"],
        ["Date of Birth:", "15-03-1986 (Age: 40 Years)"],
        ["Occupation:", "Software Engineer, MNC"],
        ["Address:", "Flat 402, Tower B, Emerald Heights, Sector 65, Gurugram, Haryana — 122018"],
        ["Phone Number:", "+91 98765 43210"],
        ["Email Address:", "rajesh.sharma1986@gmail.com"],
        ["Aadhaar No.:", "XXXX-XXXX-7812 (Partially Masked)"],
        ["Victim's UPI ID:", "rajesh.sharma@okicici"],
        ["Bank Account No.:", "50200012345678 (HDFC Bank, Sector 14, Gurugram)"],
        ["IFSC Code:", "HDFC0001234"],
    ]
    comp_table = Table(comp_data, colWidths=[5*cm, 13*cm])
    comp_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f7f8ff')]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 5*mm))

    # ── Accused / Suspect Details ─────────────────────────────────────────────
    story.append(Paragraph("B. ACCUSED / SUSPECT DETAILS (Known / Unknown)", section_style))
    acc_data = [
        ["Known By Name:", "Not Fully Known (Operating Online via Alias 'KYC Agent Rahul')"],
        ["Suspect 1 Phone:", "+91 70045 89123 (Used for WhatsApp contact)"],
        ["Suspect 2 Phone:", "+91 80012 34567 (Callback number given to victim)"],
        ["Fraudster UPI ID:", "fraudster.kyc@paytm"],
        ["Mule Account 1:", "ICICI Bank Acc. 003605012321 | IFSC: ICIC0000036"],
        ["Mule Account 2:", "SBI Bank Acc. 20198765432 | IFSC: SBIN0001234"],
        ["Mule Account 3:", "Axis Bank Acc. 913010078432 | IFSC: UTIB0000123"],
        ["Final Beneficiary:", "HDFC Current Acc. 50200098765 | IFSC: HDFC0004321"],
        ["Suspect Email:", "kyc.update.helpdesk@gmail.com"],
        ["Suspect IP (approx):", "103.230.xx.xx (via VPN - India Gateway)"],
    ]
    acc_table = Table(acc_data, colWidths=[5*cm, 13*cm])
    acc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#fff5f5'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 5*mm))

    # ── Complaint Narrative ───────────────────────────────────────────────────
    story.append(Paragraph("C. STATEMENT OF FACTS / COMPLAINT NARRATIVE", section_style))
    story.append(Paragraph(
        "The complainant, Rajesh Kumar Sharma, states that on 08-07-2026, at approximately 11:15 AM, "
        "he received a WhatsApp message from an unknown number (+91 70045 89123) claiming to be a "
        "representative of the HDFC Bank KYC updation team. The message stated that his account would be "
        "blocked within 24 hours if he did not complete an urgent KYC verification process via a link "
        "provided in the message.",
        body_style))
    story.append(Paragraph(
        "The complainant, believing the communication to be from his bank, clicked the phishing link which "
        "led to a professionally designed fake HDFC Bank portal (hdfcbank-kyc-update.in). He was asked to "
        "enter his UPI ID (rajesh.sharma@okicici), mobile banking credentials, OTP received on registered "
        "mobile, and account details. Within minutes of submitting the form, he received SMS alerts showing "
        "three unauthorized UPI transactions totaling ₹4,82,000/- debited from his HDFC account.",
        body_style))
    story.append(Paragraph(
        "Transaction 1: ₹2,00,000 transferred to mule1@icici on 08-07-2026 at 11:24:33 hrs.<br/>"
        "Transaction 2: ₹1,50,000 transferred to mule2@sbi on 08-07-2026 at 11:26:14 hrs.<br/>"
        "Transaction 3: ₹1,32,000 transferred to mule3@axis on 08-07-2026 at 11:29:05 hrs.",
        body_style))
    story.append(Paragraph(
        "The complainant immediately called the bank's toll-free number 1800-XXX-XXXX and blocked the "
        "account, but the funds had already been disbursed. He subsequently filed a complaint on the "
        "National Cyber Crime Reporting Portal (cybercrime.gov.in) on 09-07-2026 (Acknowledgement No. "
        "4501/2026/MH/NCPR) and visited the Cyber Crime Police Station on 11-07-2026.",
        body_style))
    story.append(Spacer(1, 3*mm))

    # ── Loss Details ─────────────────────────────────────────────────────────
    story.append(Paragraph("D. FINANCIAL LOSS DETAILS", section_style))
    loss_data = [
        ["Total Fraud Amount:", "₹4,82,000/- (Rupees Four Lakh Eighty-Two Thousand Only)"],
        ["Payment Mode:", "UPI (Unified Payment Interface) — PhonePe App"],
        ["Deducted From Account:", "50200012345678 — HDFC Bank, Sector 14, Gurugram"],
        ["Date of Fraud:", "08-07-2026"],
        ["Amount Frozen (if any):", "₹45,000/- (Frozen by ICICI Bank on LOC request)"],
        ["Amount Recovered:", "₹0/- (Under Investigation)"],
    ]
    loss_table = Table(loss_data, colWidths=[5.5*cm, 12.5*cm])
    loss_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f0f4ff')]),
    ]))
    story.append(loss_table)
    story.append(Spacer(1, 5*mm))

    # ── Signature Block ───────────────────────────────────────────────────────
    sig_data = [
        ["Complainant Signature:", "_______________________", "Investigating Officer:", "_______________________"],
        ["Name: Rajesh Kumar Sharma", "", "Name: Sub Inspector Pawan Kumar", ""],
        ["Date: 11-07-2026", "", "Badge No.: GGN/CYB/SI/0234", ""],
        ["", "", "Cyber Crime PS, Gurugram", ""],
    ]
    sig_table = Table(sig_data, colWidths=[4.5*cm, 4.5*cm, 4.5*cm, 4.5*cm])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Paragraph(
        "This FIR has been generated from the Cyber Crime Management System (CCMS). "
        "Any tampering with this document is a punishable offense under Section 468 IPC.",
        ParagraphStyle('footer', parent=styles['Normal'], fontSize=7.5,
                       alignment=TA_CENTER, textColor=colors.grey)
    ))

    doc.build(story)
    print(f"[OK] Generated: {path}")
    return path


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT 2: HDFC Bank Account Statement
# ══════════════════════════════════════════════════════════════════════════════
def generate_bank_statement():
    path = os.path.join(OUTPUT_DIR, "HDFC_BankStatement_July2026_Rajesh_Sharma.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    story = []

    # ── Bank Letterhead ───────────────────────────────────────────────────────
    story.append(Paragraph("HDFC BANK LIMITED", ParagraphStyle('BankHdr', parent=styles['Heading1'],
                            alignment=TA_CENTER, fontSize=18, textColor=colors.HexColor('#004C8C'),
                            fontName='Helvetica-Bold')))
    story.append(Paragraph("Registered Office: HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai — 400013",
                           ParagraphStyle('BankAddr', parent=styles['Normal'], alignment=TA_CENTER, fontSize=8.5)))
    story.append(Paragraph("Branch: Sector 14, Gurugram | IFSC: HDFC0001234 | Phone: 0124-2345678",
                           ParagraphStyle('BranchInfo', parent=styles['Normal'], alignment=TA_CENTER,
                                         fontSize=8.5, textColor=colors.grey)))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor('#004C8C')))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("ACCOUNT STATEMENT", ParagraphStyle('StmtHdr', parent=styles['Heading2'],
                            alignment=TA_CENTER, fontSize=13)))
    story.append(Spacer(1, 3*mm))

    # ── Account Info ──────────────────────────────────────────────────────────
    acc_info = [
        ["Account Holder:", "Mr. Rajesh Kumar Sharma", "Statement Period:", "01-Jul-2026 to 11-Jul-2026"],
        ["Account No.:", "50200012345678", "Account Type:", "Savings Account"],
        ["IFSC Code:", "HDFC0001234", "Currency:", "INR (Indian Rupee)"],
        ["Customer ID:", "CIF98765432", "Branch:", "Sector 14, Gurugram"],
        ["Opening Balance:", "₹5,62,300.00", "Closing Balance:", "₹80,300.00"],
    ]
    acc_table = Table(acc_info, colWidths=[4*cm, 6*cm, 4*cm, 4*cm])
    acc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#eef4ff')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 5*mm))

    # ── Transaction Table ─────────────────────────────────────────────────────
    tx_header = ["Date", "Time", "Description / Narration", "Ref No.", "Debit (₹)", "Credit (₹)", "Balance (₹)"]
    transactions = [
        ["01-Jul-26", "09:14", "Salary Credit — TechCorp India Pvt Ltd", "NEFT/082910123", "", "1,20,000.00", "5,62,300.00"],
        ["02-Jul-26", "13:22", "UPI/Swiggy Order/Dinner", "UPI/26783423", "854.00", "", "5,61,446.00"],
        ["03-Jul-26", "10:05", "IMPS/Rent Payment — Krishna Realty", "IMPS/728349121", "25,000.00", "", "5,36,446.00"],
        ["04-Jul-26", "17:31", "UPI/Zepto Grocery/Morning", "UPI/56321098", "1,230.00", "", "5,35,216.00"],
        ["05-Jul-26", "11:00", "UPI/Priya Sharma — Family Transfer", "UPI/98342716", "10,000.00", "", "5,25,216.00"],
        ["06-Jul-26", "15:42", "POS/Reliance Smart Bazaar/Shopping", "POS/TXN7382", "4,520.00", "", "5,20,696.00"],
        ["07-Jul-26", "20:10", "UPI/Netflix Subscription/Premium", "UPI/34512876", "649.00", "", "5,20,047.00"],
        ["08-Jul-26", "11:24", "UPI/DEBIT — mule1@icici — SUSPECTED FRAUD", "UPI/FRAUD001", "2,00,000.00", "", "3,20,047.00"],
        ["08-Jul-26", "11:26", "UPI/DEBIT — mule2@sbi — SUSPECTED FRAUD", "UPI/FRAUD002", "1,50,000.00", "", "1,70,047.00"],
        ["08-Jul-26", "11:29", "UPI/DEBIT — mule3@axis — SUSPECTED FRAUD", "UPI/FRAUD003", "1,32,000.00", "", "38,047.00"],
        ["09-Jul-26", "09:00", "NEFT/Bank Hold — Fraud Dispute Block", "NEFT/HOLD001", "", "", "38,047.00"],
        ["10-Jul-26", "14:55", "ATM Withdrawal/Sector 14 ATM/Gurugram", "ATM/GGN5678", "2,000.00", "", "36,047.00"],
        ["11-Jul-26", "10:30", "IMPS/Police Fees — Cyber Crime Cert.", "IMPS/001234", "1,247.00", "", "34,800.00"],
        ["11-Jul-26", "16:00", "IMPS/Partial Refund — ICICI Bank Hold", "NEFT/REF001", "", "45,500.00", "80,300.00"],
    ]
    table_data = [tx_header] + transactions
    col_widths = [1.8*cm, 1.4*cm, 6.5*cm, 3.2*cm, 2.1*cm, 2.1*cm, 2.3*cm]
    tx_table = Table(table_data, colWidths=col_widths)
    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004C8C')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.8),
        ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f8ff')]),
        ('BACKGROUND', (0, 8), (-1, 10), colors.HexColor('#fff0f0')),  # fraud rows
        ('FONTNAME', (0, 8), (-1, 10), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 8), (-1, 10), colors.HexColor('#CC0000')),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tx_table)
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(
        "[WARN] IMPORTANT: Rows highlighted in RED are under active fraud investigation under FIR No. CCB/2026/CYB/0023. "
        "These transactions have been reported to the Cyber Crime Cell, Gurugram and RBI Fraud Registry.",
        ParagraphStyle('Warning', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#990000'))))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#004C8C')))
    story.append(Paragraph(
        "This is a computer-generated statement. For queries contact: 1800-XXX-HDFC | hdfc.queries@hdfcbank.com",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7.5, alignment=TA_CENTER, textColor=colors.grey)))

    doc.build(story)
    print(f"[OK] Generated: {path}")
    return path


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT 3: NCRP Cyber Crime Complaint Form
# ══════════════════════════════════════════════════════════════════════════════
def generate_ncrp_complaint():
    path = os.path.join(OUTPUT_DIR, "NCRP_Complaint_Form_4501_2026.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=1.5*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    story = []
    story.append(Paragraph("NATIONAL CYBER CRIME REPORTING PORTAL", ParagraphStyle(
        'NCRP', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=14,
        textColor=colors.HexColor('#1a3c6e'))))
    story.append(Paragraph("cybercrime.gov.in | Ministry of Home Affairs, Government of India",
                           ParagraphStyle('sub', parent=styles['Normal'], alignment=TA_CENTER,
                                         fontSize=9, textColor=colors.grey)))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1a3c6e')))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph("ONLINE CYBER FRAUD COMPLAINT FORM", ParagraphStyle(
        'FormTitle', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=13)))
    story.append(Paragraph("Acknowledgement No.: 4501/2026/HR/NCPR", ParagraphStyle(
        'AckNo', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10,
        fontName='Helvetica-Bold', textColor=colors.HexColor('#1a3c6e'))))
    story.append(Spacer(1, 5*mm))

    fields = [
        ("1. Date of Filing:", "09-07-2026"),
        ("2. State / UT:", "Haryana"),
        ("3. District:", "Gurugram"),
        ("4. Complainant Name:", "Rajesh Kumar Sharma"),
        ("5. Complainant Contact:", "+91 98765 43210 | rajesh.sharma1986@gmail.com"),
        ("6. Category of Crime:", "Online Financial Fraud — Fake KYC / Phishing"),
        ("7. Sub-Category:", "UPI Fraud / Vishing / Smishing"),
        ("8. Date of Incident:", "08-07-2026"),
        ("9. Mode of Contact:", "WhatsApp Message + Phishing Link"),
        ("10. Fraudster Contact:", "+91 70045 89123 (WhatsApp) | kyc.update.helpdesk@gmail.com"),
        ("11. Fake Website Used:", "hdfcbank-kyc-update.in (Phishing URL — NOW BLOCKED)"),
        ("12. Fraudulent UPI IDs:", "mule1@icici | mule2@sbi | mule3@axis | fraudster.kyc@paytm"),
        ("13. Suspect Bank Accounts:", "ICICI: 003605012321 | SBI: 20198765432 | Axis: 913010078432"),
        ("14. Total Amount Defrauded:", "₹4,82,000/-"),
        ("15. Bank Name:", "HDFC Bank | Account No.: 50200012345678 | IFSC: HDFC0001234"),
        ("16. Complaint Summary:", "Victim received fake KYC update message via WhatsApp from unknown "
                                   "number. Clicked phishing link and entered UPI/bank credentials. "
                                   "₹4,82,000/- debited in 3 transactions to mule accounts within 5 minutes."),
        ("17. Evidence Attached:", "Bank statement screenshots, WhatsApp message screenshots, SMS alerts"),
        ("18. FIR Filed:", "Yes — CCB/2026/CYB/0023, Cyber Crime PS Gurugram (11-07-2026)"),
    ]

    for label, value in fields:
        row = Table([[Paragraph(label, ParagraphStyle('L', parent=styles['Normal'],
                                                       fontName='Helvetica-Bold', fontSize=9)),
                     Paragraph(value, ParagraphStyle('V', parent=styles['Normal'], fontSize=9))]],
                   colWidths=[5.5*cm, 12.5*cm])
        row.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#f7f8ff')]),
        ]))
        story.append(row)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        "This document is an official acknowledgment from the National Cyber Crime Reporting Portal. "
        "The complaint has been forwarded to the respective State Cyber Crime Cell for action. "
        "Reference No.: 4501/2026/HR/NCPR",
        ParagraphStyle('Ack', parent=styles['Normal'], fontSize=8.5,
                       alignment=TA_JUSTIFY, textColor=colors.grey)))

    doc.build(story)
    print(f"[OK] Generated: {path}")
    return path


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT 4: Account Freeze Request Letter
# ══════════════════════════════════════════════════════════════════════════════
def generate_freeze_letter():
    path = os.path.join(OUTPUT_DIR, "AccountFreeze_Request_Letter.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    story = []
    story.append(Paragraph("CYBER CRIME POLICE STATION, GURUGRAM", ParagraphStyle(
        'H', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=14,
        textColor=colors.HexColor('#1a1a6e'))))
    story.append(Paragraph("Office of the ACP Cyber Crime | Sector 14, Gurugram | Haryana — 122001",
                           ParagraphStyle('sub', parent=styles['Normal'], alignment=TA_CENTER, fontSize=9)))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.darkblue))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("No. GGN/CYB/FR/2026/0089", ParagraphStyle('ref', parent=styles['Normal'],
                            fontSize=10, fontName='Helvetica-Bold')))
    story.append(Paragraph("Date: 11-07-2026", styles['Normal']))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("To,", styles['Normal']))
    story.append(Paragraph("The Nodal Officer — Cyber Crime & Fraud,", styles['Normal']))
    story.append(Paragraph("ICICI Bank Ltd. | SBI Bank | Axis Bank Ltd.", styles['Normal']))
    story.append(Paragraph("(Via Email to: cybercrime.nodal@icicibank.com | cybercrime@sbi.co.in | nodal.cybercrime@axisbank.com)", styles['Normal']))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("Subject: <b>Request for Immediate Freeze of Mule Accounts involved in Cyber Fraud — FIR No. CCB/2026/CYB/0023</b>", styles['Normal']))
    story.append(Spacer(1, 5*mm))

    body = """Sir / Madam,

This office is investigating a cyber fraud case registered vide FIR No. CCB/2026/CYB/0023 dated 11-07-2026 under Sections 420, 465, 466, 468 IPC and Sections 66C, 66D of the IT Act 2000. The complainant, Shri Rajesh Kumar Sharma (Account Holder: HDFC Bank, A/c No. 50200012345678, IFSC: HDFC0001234), was defrauded of ₹4,82,000/- on 08-07-2026 via UPI transactions using a phishing scheme.

Preliminary investigation has revealed that the defrauded funds have been transferred to the following mule accounts operated by suspects. You are hereby requested to <b>immediately freeze the following accounts</b> under Section 17A of the Prevention of Money Laundering Act (PMLA) and Rule 9 of Prevention of Money Laundering (Maintenance of Records) Rules and preserve all KYC, transaction logs, and login records related to these accounts for submission to this office:

    1. ICICI Bank | Account No.: 003605012321 | UPI: mule1@icici | IFSC: ICIC0000036
    2. State Bank of India (SBI) | Account No.: 20198765432 | UPI: mule2@sbi | IFSC: SBIN0001234
    3. Axis Bank | Account No.: 913010078432 | UPI: mule3@axis | IFSC: UTIB0000123

Additionally, please provide the following details within 24 hours via email or in-person:
    a. Full KYC details of account holders
    b. Complete transaction history for July 2026
    c. Registered mobile number, email, and IP address logs for the above accounts
    d. Details of any other accounts linked/associated with the above

Failure to comply will be treated as obstruction in investigation under Section 179 IPC.

Please treat this as <b>URGENT AND CONFIDENTIAL</b>."""

    story.append(Paragraph(body, ParagraphStyle('Body', parent=styles['Normal'],
                           fontSize=9.5, leading=16, alignment=TA_JUSTIFY)))
    story.append(Spacer(1, 10*mm))

    sig_data = [
        ["Sd/-", ""],
        ["Sub Inspector Pawan Kumar", "(ACP Cyber Crime — Gurugram)"],
        ["Badge No.: GGN/CYB/SI/0234", ""],
        ["Cyber Crime PS, Gurugram, Haryana", ""],
        ["Phone: 0124-XXXXXXX | cybercrime.ggn@haryanapolicexxx.gov.in", ""],
    ]
    for row in sig_data:
        story.append(Paragraph(row[0], styles['Normal']))
    story.append(Spacer(1, 5*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Paragraph(
        "Copy to: SHO Cyber Crime PS | ACP Cyber Crime | SSP Gurugram | Cyber Cell HQ Haryana",
        ParagraphStyle('cc', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))

    doc.build(story)
    print(f"[OK] Generated: {path}")
    return path


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT 5: Transaction Log CSV (for Bulk Import)
# ══════════════════════════════════════════════════════════════════════════════
def generate_transaction_csv():
    path = os.path.join(OUTPUT_DIR, "fraud_transactions_CCB_2026_0023.csv")
    rows = [
        # date, sender, receiver, amount, narration, suspicious
        ["2026-07-08 11:24:33", "rajesh.sharma@okicici", "mule1@icici", "200000", "UPI/PhonePe/KYC Verification/Ref001", "true"],
        ["2026-07-08 11:26:14", "rajesh.sharma@okicici", "mule2@sbi", "150000", "UPI/PhonePe/Account Verify/Ref002", "true"],
        ["2026-07-08 11:29:05", "rajesh.sharma@okicici", "mule3@axis", "132000", "UPI/PhonePe/Update Limit/Ref003", "true"],
        ["2026-07-08 11:48:10", "mule1@icici", "mule3@axis", "90000", "IMPS/Cash Out Layer 2", "true"],
        ["2026-07-08 12:03:22", "mule2@sbi", "beneficiary@hdfc", "120000", "NEFT/Business Payment/Textile", "true"],
        ["2026-07-08 12:17:45", "mule3@axis", "beneficiary@hdfc", "185000", "NEFT/Merchant Settlement", "true"],
        ["2026-07-08 13:55:00", "beneficiary@hdfc", "mule1@icici", "40000", "UPI/Return Transfer/Ref009", "true"],
        ["2026-07-08 14:30:15", "mule1@icici", "beneficiary@hdfc", "125000", "IMPS/Final Settlement", "true"],
        ["2026-07-09 09:14:00", "victim2@sbi", "mule1@icici", "75000", "UPI/Lucky Draw Prize Fee", "true"],
        ["2026-07-09 09:45:22", "victim3@paytm", "mule2@sbi", "50000", "UPI/Insurance Premium Update", "true"],
        ["2026-07-10 10:00:00", "mule3@axis", "mule1@icici", "30000", "IMPS/Smurfing Split 1", "true"],
        ["2026-07-10 10:05:00", "mule3@axis", "mule2@sbi", "30000", "IMPS/Smurfing Split 2", "true"],
        ["2026-07-10 10:10:00", "mule3@axis", "beneficiary@hdfc", "30000", "IMPS/Smurfing Split 3", "true"],
    ]
    with open(path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["date", "sender", "receiver", "amount", "narration", "suspicious"])
        writer.writerows(rows)
    print(f"[OK] Generated: {path}")
    return path


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\nCyberTrace AI -- Police Document Generator")
    print("=" * 55)
    paths = []
    paths.append(generate_fir())
    paths.append(generate_bank_statement())
    paths.append(generate_ncrp_complaint())
    paths.append(generate_freeze_letter())
    paths.append(generate_transaction_csv())
    print("\n[OK] All documents generated successfully!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("\nDocuments:")
    for p in paths:
        print(f"   -> {os.path.basename(p)}")
    print("\nUpload these files via the Evidence tab in CyberTrace AI dashboard.")
