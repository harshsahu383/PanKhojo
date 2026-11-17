import PDFDocument from "pdfkit";

const COLORS = {
    navy: "#12324A",
    teal: "#087E78",
    ink: "#172B3A",
    muted: "#647786",
    pale: "#F2F7F8",
    border: "#DCE7EA",
    white: "#FFFFFF",
};

const roundedCard = (doc, x, y, width, height, fill = COLORS.white, stroke = COLORS.border, radius = 12) => {
    doc.save();
    doc.roundedRect(x, y, width, height, radius).fillAndStroke(fill, stroke);
    doc.restore();
};

const label = (doc, value, x, y, options = {}) => {
    doc.font("Helvetica-Bold")
        .fontSize(options.size ?? 8)
        .fillColor(options.color ?? COLORS.muted)
        .text(String(value).toUpperCase(), x, y, { characterSpacing: options.spacing ?? 0.8 });
};

export const createProtectedPanPdf = ({ fullName, requestNumber, panNumber, password }) => new Promise((resolve, reject) => {
    try {
        const doc = new PDFDocument({
            size: "A4",
            margins: { top: 42, bottom: 42, left: 46, right: 46 },
            userPassword: password,
            ownerPassword: `${password}-owner`,
            permissions: {
                printing: "highResolution",
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            },
            info: {
                Title: "PANKhojo — PAN Finding Result",
                Author: "PANKhojo",
                Subject: "Confidential PAN finding result",
                Keywords: "PANKhojo, PAN result, confidential",
            },
        });

        const chunks = [];
        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pageWidth = doc.page.width;
        const left = 46;
        const contentWidth = pageWidth - left * 2;
        const issuedOn = new Intl.DateTimeFormat("en-IN", {
            day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
        }).format(new Date());

        // Brand header
        doc.save();
        doc.rect(0, 0, pageWidth, 172).fill(COLORS.navy);
        doc.rect(0, 164, pageWidth, 8).fill(COLORS.teal);
        doc.restore();

        doc.font("Helvetica-Bold").fontSize(25).fillColor(COLORS.white)
            .text("PANKhojo", left, 43, { characterSpacing: 0.3 });
        doc.font("Helvetica").fontSize(9).fillColor("#C8D9E1")
            .text("PAN FINDER  /  SECURE RESULT", left, 78, { characterSpacing: 1.5 });
        doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.white)
            .text("Your PAN result is ready", left, 111);
        doc.font("Helvetica").fontSize(9).fillColor("#D7E5E9")
            .text("A private document prepared for the customer named below.", left, 140);

        // Intro and metadata
        doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.ink)
            .text("Result summary", left, 202);
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
            .text("Please review the details carefully and keep this document secure.", left, 222);

        const metaY = 250;
        const gap = 12;
        const cardWidth = (contentWidth - gap) / 2;
        roundedCard(doc, left, metaY, cardWidth, 66, COLORS.pale);
        roundedCard(doc, left + cardWidth + gap, metaY, cardWidth, 66, COLORS.pale);
        label(doc, "Customer name", left + 14, metaY + 13);
        doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.ink)
            .text(fullName || "Customer", left + 14, metaY + 32, { width: cardWidth - 28, ellipsis: true });
        label(doc, "Request reference", left + cardWidth + gap + 14, metaY + 13);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink)
            .text(requestNumber || "—", left + cardWidth + gap + 14, metaY + 33, { width: cardWidth - 28, ellipsis: true });

        // PAN result card
        const resultY = 344;
        roundedCard(doc, left, resultY, contentWidth, 142, COLORS.white, COLORS.border, 14);
        doc.save();
        doc.roundedRect(left, resultY, contentWidth, 7, 4).fill(COLORS.teal);
        doc.restore();
        label(doc, "Your PAN number", left + 20, resultY + 25, { color: COLORS.teal, size: 8, spacing: 1.1 });
        doc.font("Helvetica-Bold").fontSize(25).fillColor(COLORS.navy)
            .text(String(panNumber || "").toUpperCase(), left + 20, resultY + 57, { characterSpacing: 2.2 });
        doc.moveTo(left + 20, resultY + 105).lineTo(left + contentWidth - 20, resultY + 105)
            .strokeColor(COLORS.border).lineWidth(0.8).stroke();
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted)
            .text("Keep your PAN details private. Share them only when required.", left + 20, resultY + 116);

        // Document information
        const infoY = 518;
        label(doc, "Document information", left, infoY);
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.ink)
            .text(`Issued on  ${issuedOn}`, left, infoY + 20);
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.ink)
            .text("Prepared by  PANKhojo", left, infoY + 38);

        // Security note
        const noteY = 584;
        roundedCard(doc, left, noteY, contentWidth, 76, "#F0F7F6", "#CDE4E1", 10);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.teal)
            .text("SECURITY REMINDER", left + 14, noteY + 13);
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.ink)
            .text("This PDF is password-protected. Do not forward the file or share its password. PANKhojo will never ask you to disclose your PDF password.", left + 14, noteY + 31, { width: contentWidth - 28, lineGap: 3 });

        // Footer and clear private-service disclaimer
        doc.moveTo(left, 690).lineTo(pageWidth - left, 690).strokeColor(COLORS.border).lineWidth(0.8).stroke();
        doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy)
            .text("PANKhojo", left, 706);
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted)
            .text("Private PAN-finding service · Not a government website or authority", left, 721, { width: contentWidth });
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted)
            .text("Please verify your details against official records where necessary.", left, 735, { width: contentWidth });

        doc.end();
    } catch (error) {
        reject(error);
    }
});
