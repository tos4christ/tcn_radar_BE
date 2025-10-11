module.exports = epochToHms = (epochTimestamp) => {
  // If the epoch timestamp is in seconds, convert it to milliseconds
  const date = new Date(epochTimestamp * 1000); 

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Format the output to ensure two digits for each component
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// const epochTime = 1760194225; // Example epoch timestamp (March 15, 2023 12:00:00 PM UTC)
// const timeString = epochToHms(epochTime);
// console.log(timeString); // Output: 12:00:00 (or adjusted for local timezone)