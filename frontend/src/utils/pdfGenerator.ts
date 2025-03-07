import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';

// Add type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Helper function to convert minutes to readable time format
const formatTime = (minutes: number): string => {
  if (minutes === -1) return 'Not set';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to format duration in hours
const formatDuration = (startTime: number, endTime: number): string => {
  if (startTime === -1 || endTime === -1) return 'Not set';
  const durationMinutes = endTime - startTime;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${minutes} min`;
  }
};

// Format the POI type for display
const formatPoiType = (type: string): string => {
  if (!type) return 'Unknown';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate and download a PDF of the itinerary
 */
export const generateItineraryPDF = (
  itineraryPOIs: ItineraryPOI[], 
  tripData: TripData
): void => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set document properties
  const cityName = tripData.city.charAt(0).toUpperCase() + tripData.city.slice(1);
  const countryName = tripData.country.charAt(0).toUpperCase() + tripData.country.slice(1);
  const title = `${cityName}, ${countryName} Itinerary`;
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  // Add trip dates
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let dateText = 'Trip Dates: ';
  
  if (tripData.fromDT && tripData.toDT) {
    const fromDate = format(tripData.fromDT, 'MMM d, yyyy');
    const toDate = format(tripData.toDT, 'MMM d, yyyy');
    dateText += `${fromDate} to ${toDate}`;
  } else {
    dateText += 'Not specified';
  }
  
  doc.text(dateText, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  doc.text(`Duration: ${tripData.monthlyDays} days`, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
  
  // Organize POIs by day
  const poisByDay: { [key: number]: ItineraryPOI[] } = {};
  
  // Sort POIs by day and start time
  const sortedPOIs = [...itineraryPOIs].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.StartTime - b.StartTime;
  });
  
  // Group POIs by day
  sortedPOIs.forEach(poi => {
    if (poi.day !== -1) { // Skip unused POIs
      if (!poisByDay[poi.day]) {
        poisByDay[poi.day] = [];
      }
      poisByDay[poi.day].push(poi);
    }
  });
  
  // Current Y position for content
  let yPos = 50;
  
  // Loop through each day and add content
  Object.keys(poisByDay).forEach((day, index) => {
    const dayNumber = parseInt(day);
    const dayPOIs = poisByDay[dayNumber];
    
    // Add page break if needed
    if (yPos > 250 && index > 0) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add day header
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text(`Day ${dayNumber}`, 14, yPos);
    yPos += 8;
    
    // Table headers and data for this day
    const tableHeaders = [['Time', 'Place', 'Type', 'Duration']];
    const tableData = dayPOIs.map(poi => [
      `${formatTime(poi.StartTime)} - ${formatTime(poi.EndTime)}`,
      poi.name,
      formatPoiType(poi.type),
      formatDuration(poi.StartTime, poi.EndTime)
    ]);
    
    // Add table for the day - Use the imported autoTable function directly
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Time column
        1: { cellWidth: 'auto' }, // Place column
        2: { cellWidth: 30 }, // Type column
        3: { cellWidth: 30 }, // Duration column
      },
      margin: { top: 10 },
      didDrawPage: () => {
        // Footer with page number
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        doc.setFontSize(10);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageSize.getWidth() / 2, pageHeight - 10, {
          align: 'center'
        });
      }
    });
    
    // Update Y position for next day - Since we're not using doc.lastAutoTable, get the finalY from the returned value
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 30;
    yPos = finalY + 15;
  });
  
  // Add empty itinerary message if no POIs are scheduled
  if (Object.keys(poisByDay).length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("No places added to the itinerary yet.", doc.internal.pageSize.getWidth() / 2, 60, {
      align: 'center'
    });
  }
  
  // Add footer with generation date
  const pageSize = doc.internal.pageSize;
  const pageHeight = pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const today = format(new Date(), 'MMM d, yyyy');
  doc.text(`Generated on ${today}`, pageSize.getWidth() - 15, pageHeight - 10, {
    align: 'right'
  });
  
  // Download the PDF
  doc.save(`${cityName}_${countryName}_Itinerary.pdf`);
}; 