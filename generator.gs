let slideTemplateId = "PRESENTATION_ID";
let tempFolderId = "FOLDER_ID"; // Create an empty folder in Google Drive

/**
 * Creates a custom menu "Name Tags" in the spreadsheet
 * with drop-down options to create name tags and export to PDF
 */
function onOpen(e) {
	let ui = SpreadsheetApp.getUi();
	ui.createMenu("Name Tags")
		.addItem("Create name tags", "createNameTags")
		.addItem("Convert to PDF", "convertToPdf")
		.addToUi();
}

/**
 * Creates a personalized name tag for each participant
 * and stores every individual Slides doc on Google Drive
 */
function createNameTags() {
	// Load the Google Slide template file
	let template = DriveApp.getFileById(slideTemplateId);

	// Get all participant's data from the spreadsheet and identify the headers
	let sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
	let values = sheet.getDataRange().getValues();
	let headers = values[0];
	let nameIndex = headers.indexOf("Name");
	let dateIndex = headers.indexOf("Date");
	let slideIndex = headers.indexOf("Slide");
	let statusIndex = headers.indexOf("Status");

	// Iterate through each row to capture individual details
	for (let i = 1; i < values.length; i++) {
		let rowData = values[i];
		let name = rowData[nameIndex];
		let date = rowData[dateIndex];

		// Make a copy of the Slide template and rename it with participant's name
		let tempFolder = DriveApp.getFolderById(tempFolderId);
		let slideId = template.makeCopy(tempFolder).setName(name).getId();
		let slide = SlidesApp.openById(slideId).getSlides()[0];

		// Replace placeholder values with actual participant related details
		slide.replaceAllText("Name", name);
		slide.replaceAllText(
			"Date",
			"Date: " +
				Utilities.formatDate(
					date,
					Session.getScriptTimeZone(),
					"MMMM dd, yyyy"
				)
		);

		// Update the spreadsheet with the new Slide Id and status
		sheet.getRange(i + 1, slideIndex + 1).setValue(slideId);
		sheet.getRange(i + 1, statusIndex + 1).setValue("CREATED");
		SpreadsheetApp.flush();
	}
}

/**
 * Converts every google slide file to PDF
 * This is done so that you can make any necessary adjustments before getting the pdf file which is immutable
 */
function convertToPdf() {
	let tempFolder = DriveApp.getFolderById(tempFolderId);
	let files = tempFolder.getFiles();

	// If files.hasNext() returns false it means there are no files in the folder
	if (!files.hasNext()) {
		SpreadsheetApp.getUi().alert(
			"You have to create the slides first before converting to PDF"
		);
		SpreadsheetApp.flush();
		return;
	}

	// Loop through the folder files and convert each to PDF
	while (files.hasNext()) {
		// Convert to PDF
		let file = files.next();
		let name = file.getName();
		let pdf = file.getAs(MimeType.PDF);
		tempFolder.createFile(pdf).setName(name);
		tempFolder.removeFile(file);
	}
}
