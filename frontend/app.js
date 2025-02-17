// Handle the API request and dynamically populate the list
document.getElementById('loadSpecialists').addEventListener('click', fetchPendingSpecialists);

async function fetchPendingSpecialists() {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/specialists/pending', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      console.log(response.data); 
  
      const specialistsList = response.data.data;
      const listContainer = document.getElementById('specialists-list');
  
      listContainer.innerHTML = '';
  
      specialistsList.forEach(specialist => {
        const specialistItem = document.createElement('div');
        specialistItem.innerHTML = `
          <h3>${specialist.firstName} ${specialist.lastName}</h3>
          <p>${specialist.specialization}</p>
          <button onclick="approveSpecialist('${specialist._id}')">Approve</button>
          <button onclick="rejectSpecialist('${specialist._id}')">Reject</button>
        `;
        listContainer.appendChild(specialistItem);
      });
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  }
  
async function approveSpecialist(specialistId) {
  try {
    await axios.put(`http://localhost:5000/api/admin/specialists/${specialistId}/approve`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    alert('Specialist approved');
    fetchPendingSpecialists();
  } catch (error) {
    console.error('Error approving specialist:', error);
  }
}

async function rejectSpecialist(specialistId) {
  try {
    await axios.put(`http://localhost:5000/api/admin/specialists/${specialistId}/reject`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    alert('Specialist rejected');
    fetchPendingSpecialists(); 
  } catch (error) {
    console.error('Error rejecting specialist:', error);
  }
}
