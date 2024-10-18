import fs from 'fs';
import csv from 'csv-parser';

export const surreallist_camera_angles = []; // Correctly export the array

// Function to load camera angles from CSV file
const loadCameraAngles = () => {
  fs.createReadStream('surrealistic_camera_angles_final.csv')
    .pipe(csv())
    .on('data', (row) => {
    
      if (row['Camera Angle']) { // Use the correct property name
        surreallist_camera_angles.push(row['Camera Angle']); // Push the correct value
      } else {
          console.warn('No angle found in row:', row); // Warn if no angle is found
      }
    })
    .on('end', () => {
     // console.log('Camera angles loaded:', surreallist_camera_angles);
    });
};

// Call the function to load camera angles on server start
loadCameraAngles();
