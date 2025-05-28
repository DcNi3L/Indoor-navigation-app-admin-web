import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { robotoBase64 } from "../assets/fonts/roboto_base64";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver"
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import { FaTrash } from "react-icons/fa";
import { PiExportFill } from "react-icons/pi";
import { BiSolidFilePng } from "react-icons/bi";
import { FaFilePdf } from "react-icons/fa6";


interface QRItem {
  label: string;
  value: string;
  image: string;
}

export default function QRPoints() {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [qrList, setQrList] = useState<QRItem[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedQrs, setSelectedQrs] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("qrList");
    if (saved) setQrList(JSON.parse(saved));
  }, []);
  
  useEffect(() => {
    if (qrList.length > 0) {
      localStorage.setItem("qrList", JSON.stringify(qrList));
    }
  }, [qrList]);  

  const handleGenerate = () => {
    if (!label.trim()) return;

    const tempContainer = document.createElement("div");
    document.body.appendChild(tempContainer);

    const qrElement = (
      <QRCodeCanvas
        value={label}
        size={210}
        level="H"
        includeMargin
      />
    );

    const root = ReactDOM.createRoot(tempContainer);
    root.render(qrElement);

    setTimeout(() => {
      const canvas = tempContainer.querySelector("canvas") as HTMLCanvasElement;
      if (canvas) {
        const image = canvas.toDataURL("image/png");

        const newQr = { label, value: label, image };
        const updatedList = [...qrList, newQr];
        setQrList(updatedList);

        localStorage.setItem("qrList", JSON.stringify(updatedList));
        setLabel("");
      }

      root.unmount();
      document.body.removeChild(tempContainer);
    }, 100);
  };  

  const downloadPDF = (qrItem: { label: string; value: string }) => {
    const canvas = document.getElementById(`qr-${qrItem.value}`) as HTMLCanvasElement;
    if (!canvas) return;
  
    const scale = 2;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
  
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);
  
    const imgData = tempCanvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const qrSize = 120;
  
    // 🔹 Верхний заголовок
    pdf.setTextColor("#333333");
    pdf.setFontSize(20);
    pdf.setFont("Roboto");
    const title = t("qrCodeTitle");
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 25);
  
    // 🔹 QR-код в рамке
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 55;
    pdf.setDrawColor(50);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5); // рамка
    pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize);
  
    // 🔹 Нижний текст
    pdf.setFontSize(12);
    pdf.setTextColor("#888888");
    pdf.text(t("qrCodeFooter"), pageWidth / 2, pageHeight - 20, {
      align: "center",
    });
  
    pdf.save(`${qrItem.label}.pdf`);
  };
  
  const exportAllAsZip = async () => {
    const zip = new JSZip();
    const pngFolder = zip.folder("png");
    const pdfFolder = zip.folder("pdf");
  
    for (const qr of qrList) {
      const canvas = document.getElementById(`qr-${qr.value}`) as HTMLCanvasElement;
      if (!canvas) continue;
  
      // Улучшенное качество: отрисовываем масштабированный QR
      const scale = 2;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) continue;
      ctx.scale(scale, scale);
      ctx.drawImage(canvas, 0, 0);
  
      const imgData = tempCanvas.toDataURL("image/png");
  
      // ⬇️ Сохраняем PNG
      const pngBlob = await (await fetch(imgData)).blob();
      pngFolder?.file(`${qr.label}.png`, pngBlob);
  
      // 📄 Генерация PDF с тем же стилем, как в downloadPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const qrSize = 120;
  
      // Заголовок
      pdf.setTextColor("#333333");
      pdf.setFontSize(20);
      pdf.setFont("Roboto");
      const title = t("qrCodeTitle");
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, 25);
  
      // QR-код с рамкой
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 55;
      pdf.setDrawColor(50);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5);
      pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize);
  
      // Нижняя подсказка
      pdf.setFontSize(12);
      pdf.setTextColor("#888888");
      pdf.text(
        t("qrCodeFooter"),
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );
  
      const pdfBlob = pdf.output("blob");
      pdfFolder?.file(`${qr.label}.pdf`, pdfBlob);
    }
  
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, t("exportFileName"));
  };   

  return (
    <div className="p-6 mt-10 text-gray-900 dark:text-white max-w-4xl mx-auto">
      <h1 className="text-3xl text-center my-2 font-bold mb-4">🧭 {t("qrTitle")}</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
      {t("qrDescription")}
      </p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("qrPlaceholder")}
            className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <button
            onClick={handleGenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
          >
            {t("generate")}
          </button>
        </div>

        {qrList.length > 0 && (
          <div className="w-full flex pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-7xl">
              {qrList.map((qr, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 text-center shadow"
                >
                  <div className="flex justify-center relative">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedQrs.includes(qr.value)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedQrs((prev) =>
                            checked ? [...prev, qr.value] : prev.filter((v) => v !== qr.value)
                          );
                        }}
                        className="absolute top-1.5 left-1.5 w-4 h-4"
                      />
                    )}
                    <QRCodeCanvas
                      id={`qr-${qr.value}`}
                      value={qr.value}
                      size={210}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="mt-2 font-medium">{qr.label}</p>
                  <div className="mt-3 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        const canvas = document.getElementById(`qr-${qr.value}`) as HTMLCanvasElement;
                        const pngUrl = canvas
                          .toDataURL("image/png")
                          .replace("image/png", "image/octet-stream");
                        const link = document.createElement("a");
                        link.href = pngUrl;
                        link.download = `${qr.label}.png`;
                        link.click();
                      }}
                      className="flex itemx-center gap-2 text-sm border border-green-600 hover:bg-green-700 hover:text-white text-green-600 px-3 py-2 rounded"
                    >
                      {t("exporT")} <BiSolidFilePng size={22} />
                    </button>
                    <button
                      onClick={() => downloadPDF(qr)}
                      className="flex itemx-center gap-2 text-sm border border-blue-600 hover:bg-blue-700 hover:text-white text-blue-600 px-3 py-2 rounded"
                    >
                      {t("exporT")} <FaFilePdf size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {qrList.length > 0 && (
          <div className="mt-6 flex justify-center items-center gap-3">
            {!selectMode ? (
              <button
                onClick={() => {
                  setSelectMode(true);
                  setSelectedQrs([]);
                }}
                className="border border-red-600 flex items-center gap-2 hover:bg-red-700 hover:text-white text-red-600 px-5 py-2 rounded shadow"
              >
                <FaTrash /> {t("delete")}
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedQrs([]);
                  }}
                  className="border border-gray-400 hover:bg-gray-500 hover:text-white text-gray-400 px-5 py-2 rounded shadow"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => {
                    if (selectedQrs.length === 0) return;
                    const updated = qrList.filter((qr) => !selectedQrs.includes(qr.value));
                    setQrList(updated);
                    setSelectMode(false);
                    setSelectedQrs([]);
                    localStorage.setItem("qrList", JSON.stringify(updated));
                  }}
                  className="border border-red-600 hover:bg-red-700 hover:text-white text-red-600 px-5 py-2 rounded shadow"
                >
                  {t("deleteSelected")}
                </button>
              </div>
            )}

            {qrList.length > 1 && !selectMode && (
              <button
                onClick={exportAllAsZip}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded shadow"
              >
                <PiExportFill size={20} /> {t("exportAll")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
