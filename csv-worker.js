self.onmessage = function (e) {
  var csvFile = e.data.csvFile;
  var markerType = e.data.markerType || "charity";

  fetch(csvFile)
    .then((response) => response.text())
    .then((csv) => {
      var markerData = [];
      let rows = csv.split("\n").slice(1);

      rows.forEach((row) => {
        let columns = row.split(",");
        let charityRegNumber = columns[0] || "Unknown";
        let charityName = columns[1] || "Unknown";
        let streetAddressLine1 = columns[2] ? columns[2].trim() : "";
        let streetAddressLine2 = columns[3] ? columns[3].trim() : "";
        let streetSuburb = columns[4] ? columns[4].trim() : "";
        let streetCity = columns[5] ? columns[5].trim() : "";
        let streetPostcode = columns[6] ? columns[6].trim() : "";
        let streetCountry = columns[7] ? columns[7].trim() : "";
        let streetAddress = `${streetAddressLine1}${
          streetAddressLine2 ? ", " + streetAddressLine2 : ""
        }${
          streetSuburb ? ", " + streetSuburb : ""
        }, ${streetCity}, ${streetPostcode} ${streetCountry}`.trim();

        let lat = parseFloat(columns[8]);
        let lon = parseFloat(columns[9]);

        if (!isNaN(lat) && !isNaN(lon)) {
          // Link to the Charities Register using the CC number
          const registerUrl = `https://register.charities.govt.nz/Charity/Details/${encodeURIComponent(
            charityRegNumber
          )}`;

          const popupContent = `
  <div class="addr-pop">
    <strong>${charityName}</strong>
    <div style="margin:6px 0 4px;">
      <span class="cc-pill">${charityRegNumber}</span>
      <a class="register-btn" href="${registerUrl}" target="_blank" rel="noopener noreferrer">
        View on Charities Register <span aria-hidden="true">↗</span>
      </a>
    </div> 
  </div>
`;

          markerData.push({
            lat,
            lon,
            charityRegNumber,
            charityName,
            streetAddress,
            popupContent,
            markerType,
          });
        }
      });

      self.postMessage(markerData);
    })
    .catch(function (error) {
      console.log("Error loading CSV data:", error);
      self.postMessage([]);
    });
};
