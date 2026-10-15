import io
from datetime import datetime
from typing import Any, Dict, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def format_inr(paise: int) -> str:
    rupees = paise / 100.0
    return f"Rs. {rupees:,.2f}"


def build_project_pdf_report(
    project_name: str,
    project_description: Optional[str],
    room_name: str,
    room_width_m: float,
    room_length_m: float,
    room_height_m: float,
    scene_revision: int,
    objects: List[Dict[str, Any]],
    catalog_map: Dict[str, Dict[str, Any]],
    subtotal_paise: int,
    cgst_paise: int,
    sgst_paise: int,
    total_paise: int,
    assumptions: Optional[str] = None,
) -> bytes:
    """
    Generates a professional interior design and budget specification PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    brand_style = ParagraphStyle(
        "BrandHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#C2410C"),  # Orange-700
    )
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1F2937"),  # Gray-800
    )
    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#6B7280"),  # Gray-500
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#111827"),
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#374151"),
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1F2937"),
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#111827"),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("InteriorAI Studio", brand_style))
    story.append(Paragraph("Interior Design & Budget Specification Report", title_style))
    report_date = datetime.now().strftime("%d %B %Y, %I:%M %p")
    story.append(
        Paragraph(
            f"Generated on: {report_date} • Scene Revision: #{scene_revision} • Precision: INR (Integer Paise)",
            meta_style,
        )
    )
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#EA580C"), spaceAfter=15))

    # 2. Project & Space Specification
    story.append(Paragraph("1. Space & Project Specification", heading_style))
    story.append(Spacer(1, 6))

    floor_area_sqm = room_width_m * room_length_m
    floor_area_sqft = floor_area_sqm * 10.7639

    spec_data = [
        [
            Paragraph("<b>Project:</b>", body_style),
            Paragraph(project_name, body_style),
            Paragraph("<b>Room Name:</b>", body_style),
            Paragraph(room_name, body_style),
        ],
        [
            Paragraph("<b>Dimensions:</b>", body_style),
            Paragraph(f"{room_width_m:.2f}m (W) × {room_length_m:.2f}m (L) × {room_height_m:.2f}m (H)", body_style),
            Paragraph("<b>Floor Area:</b>", body_style),
            Paragraph(f"{floor_area_sqm:.2f} m² ({floor_area_sqft:.1f} sq.ft.)", body_style),
        ],
        [
            Paragraph("<b>Description:</b>", body_style),
            Paragraph(project_description or "Standard interior project workspace", body_style),
            Paragraph("<b>Status:</b>", body_style),
            Paragraph(f"Active Design (Rev #{scene_revision})", body_style),
        ],
    ]

    spec_table = Table(spec_data, colWidths=[70, 180, 75, 195])
    spec_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F9FAFB")),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F3F4F6")),
            ]
        )
    )
    story.append(spec_table)
    story.append(Spacer(1, 15))

    # 3. Furniture Schedule
    story.append(Paragraph(f"2. Furniture Specification Schedule ({len(objects)} Items)", heading_style))
    story.append(Spacer(1, 6))

    furniture_rows = [
        [
            Paragraph("#", table_header),
            Paragraph("Item Name & Code", table_header),
            Paragraph("Category", table_header),
            Paragraph("Dimensions (W×D×H)", table_header),
            Paragraph("Position (X, Z)", table_header),
            Paragraph("Unit Rate", table_header),
            Paragraph("Total (INR)", table_header),
        ]
    ]

    for idx, obj in enumerate(objects, start=1):
        cid = obj.get("catalog_item_id", "")
        cat_info = catalog_map.get(cid, {})
        name = cat_info.get("name", cid)
        category = cat_info.get("category", "General").capitalize()
        rate_paise = cat_info.get("price_paise", 0)

        dim = obj.get("dimensions", {})
        pos = obj.get("position", {})
        dim_str = f"{dim.get('width_m', 0):.2f} × {dim.get('depth_m', 0):.2f} × {dim.get('height_m', 0):.2f}m"
        pos_str = f"({pos.get('x_m', 0):.2f}, {pos.get('z_m', 0):.2f})m"

        furniture_rows.append(
            [
                Paragraph(str(idx), table_cell),
                Paragraph(f"<b>{name}</b><br/><font color='#6B7280'>{cid}</font>", table_cell),
                Paragraph(category, table_cell),
                Paragraph(dim_str, table_cell),
                Paragraph(pos_str, table_cell),
                Paragraph(format_inr(rate_paise), table_cell),
                Paragraph(format_inr(rate_paise), table_cell),
            ]
        )

    if len(objects) == 0:
        furniture_rows.append(
            [
                Paragraph("-", table_cell),
                Paragraph("No furniture placed in scene.", table_cell),
                Paragraph("-", table_cell),
                Paragraph("-", table_cell),
                Paragraph("-", table_cell),
                Paragraph("-", table_cell),
                Paragraph("Rs. 0.00", table_cell),
            ]
        )

    furniture_table = Table(
        furniture_rows,
        colWidths=[20, 160, 65, 100, 75, 60, 60],
    )
    furniture_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(furniture_table)
    story.append(Spacer(1, 15))

    # 4. Financial & Budget Breakdown
    story.append(Paragraph("3. Preliminary Financial Estimate Breakdown", heading_style))
    story.append(Spacer(1, 6))

    budget_rows = [
        [Paragraph("Subtotal (Furniture itemized schedule):", body_style), Paragraph(f"<b>{format_inr(subtotal_paise)}</b>", body_style)],
        [Paragraph("Central GST (CGST @ 9.0%):", body_style), Paragraph(format_inr(cgst_paise), body_style)],
        [Paragraph("State GST (SGST @ 9.0%):", body_style), Paragraph(format_inr(sgst_paise), body_style)],
        [Paragraph("<b>Total Estimated Project Budget (INR):</b>", heading_style), Paragraph(f"<b>{format_inr(total_paise)}</b>", heading_style)],
    ]

    budget_table = Table(budget_rows, colWidths=[380, 140])
    budget_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 2), colors.HexColor("#F9FAFB")),
                ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#FEF3C7")),  # Amber-100 highlight
                ("PADDING", (0, 0), (-1, -1), 5),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("LINEBELOW", (0, 2), (-1, 2), 1, colors.HexColor("#D97706")),
            ]
        )
    )
    story.append(budget_table)
    story.append(Spacer(1, 15))

    # 5. Regulatory & Estimation Assumptions
    story.append(Paragraph("4. Regulatory Assumptions & Disclaimers", heading_style))
    story.append(Spacer(1, 4))
    default_assumptions = (
        "1. All costs presented are preliminary estimates based on illustrative catalog reference prices.\n"
        "2. Standard Indian Goods & Services Tax (GST 18%: 9% CGST + 9% SGST) is applied on all goods.\n"
        "3. This estimate excludes site carpentry, masonry alterations, false ceiling work, wall painting, electrical modifications, and final freight delivery charges unless specifically contracted."
    )
    story.append(Paragraph(assumptions or default_assumptions, meta_style))
    story.append(Spacer(1, 20))

    # Footer note
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1D5DB"), spaceAfter=6))
    story.append(
        Paragraph(
            "InteriorAI Studio — Confidential Design Document • Produced with Exact Integer Paise Accounting",
            meta_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
