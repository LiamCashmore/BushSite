window.addEventListener('load', function() {
    // Only show the popup if it hasn't been shown in this session
    if (!sessionStorage.getItem('popupDisplayed')) {
      document.getElementById('popup-overlay').style.display = 'flex';
    }
  });
  
  // Hide the popup when the close button is clicked and store the flag in sessionStorage
  document.getElementById('close-popup').addEventListener('click', function() {
    document.getElementById('popup-overlay').style.display = 'none';
    sessionStorage.setItem('popupDisplayed', 'true');
  });