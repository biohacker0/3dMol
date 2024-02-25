document.addEventListener("DOMContentLoaded", function () {
  let element = document.querySelector("#container-01");
  let startInput = document.getElementById("start");
  let endInput = document.getElementById("end");
  let colorPicker = document.getElementById("colorPicker");
  let annotateButton = document.getElementById("annotate");
  let sequenceDisplay = document.getElementById("sequenceDisplay");
  let highlightedSegments = [];
  let pdbFileInput = document.getElementById("pdbFile");
  let viewer;

  if (
    element &&
    startInput &&
    endInput &&
    colorPicker &&
    annotateButton &&
    sequenceDisplay &&
    pdbFileInput
  ) {
    let defaultPDBFile = "5ylu.pdb"; // Default PDB file path

    // Load default PDB file initially
    loadDefaultPDB();

    // Event listener for file input change
    pdbFileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const pdbData = e.target.result;
          loadPDBData(pdbData);
        };
        reader.readAsText(file);
      }
    });

    function loadDefaultPDB() {
      // Load default PDB file if no file uploaded
      jQuery.ajax(defaultPDBFile, {
        success: function (data) {
          loadPDBData(data);
        },
        error: function (hdr, status, err) {
          console.error("Failed to load default PDB file: " + err);
        },
      });
    }

    function loadPDBData(pdbData) {
      if (viewer) {
        viewer.clear();
      }
      let config = { backgroundColor: "white" };
      viewer = $3Dmol.createViewer(element, config);

      viewer.addModel(pdbData, "pdb");
      viewer.setStyle({}, { cartoon: { color: "spectrum" } });
      viewer.zoomTo();
      viewer.render();

      let sequence = extractSequence(pdbData);
      sequenceDisplay.innerText = sequence;
    }

    annotateButton.addEventListener("click", function () {
      let selectionStart = parseInt(startInput.value.trim());
      let selectionEnd = parseInt(endInput.value.trim());
      let selectedColor = colorPicker.value;

      if (isNaN(selectionStart) || isNaN(selectionEnd)) {
        alert("Please enter valid start and end indexes.");
        return;
      }

      viewer.setStyle(
        { resi: selectionStart + "-" + selectionEnd },
        { cartoon: { color: selectedColor } }
      );

      highlightedSegments.push({
        start: selectionStart,
        end: selectionEnd,
        color: selectedColor,
      });

      let x = 0,
        y = 0,
        z = 0;
      for (let i = selectionStart; i <= selectionEnd; i++) {
        let atom = viewer.getModel().selectedAtoms({ serial: i })[0];
        x += atom.x;
        y += atom.y;
        z += atom.z;
      }
      x /= selectionEnd - selectionStart + 1;
      y /= selectionEnd - selectionStart + 1;
      z /= selectionEnd - selectionStart + 1;

      let sequenceName = prompt("Enter sequence name:");
      if (sequenceName) {
        viewer.addLabel(sequenceName, {
          position: { x: x, y: y, z: z },
          fontSize: 20,
          backgroundColor: selectedColor,
        });
        viewer.render();
      }

      highlightText();
    });

    function highlightText() {
      let sequenceText = sequenceDisplay.innerText;
      let highlightedSequence = "";
      let lastIndex = 0;
      for (let i = 0; i < sequenceText.length; i++) {
        let char = sequenceText.charAt(i);
        let color = null;
        for (let segment of highlightedSegments) {
          if (i >= segment.start && i <= segment.end) {
            color = segment.color;
            break;
          }
        }
        if (color) {
          if (lastIndex !== i) {
            highlightedSequence += sequenceText.substring(lastIndex, i);
          }
          highlightedSequence += `<span class="highlighted" style="color: ${color};">${char}</span>`;
          lastIndex = i + 1;
        }
      }
      if (lastIndex < sequenceText.length) {
        highlightedSequence += sequenceText.substring(lastIndex);
      }
      sequenceDisplay.innerHTML = highlightedSequence;
    }
  } else {
    console.error("Required elements not found.");
  }
});

function extractSequence(pdbData) {
  let lines = pdbData.split("\n");
  let sequence = "";
  for (let line of lines) {
    if (line.startsWith("SEQRES")) {
      let tokens = line.trim().split(/\s+/);
      for (let i = 4; i < tokens.length; i++) {
        sequence += tokens[i] + " ";
      }
    }
  }
  return sequence.trim();
}
console.log("ram");
