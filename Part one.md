<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Login Portal</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #232b94; 
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh; 
            .form-container {
                background-color: rgb(92,184,80);
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                width: 300px; 
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, button {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-sizing: border-box;
                    button { background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 16px; }
                    button:hover { background-color: #0056b3; }
                }
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Company sign in</h2>
        <form id="portalForm">
            <div class="form-group">
                <label for="userId">Enter ID Number:</label>
                <input type="text" id="userId" required placeholder="e.x. 12345">
            </div>
            <div class="form-group">
                <label for="userRole">Choose a Role:</label>
                <select id="userRole" required>
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
            </div>
            
                </select>
            </div>
            <button type="submit">Go to Dashboard</button>
        </form>
    </div>

    <script >
document.getElementById('portalForm').addEventListener('submit', function(e) {
    e.preventDefault(); //stop page from refreshing
    const userId = document.getElementById('userId').value;
    const userRole = document.getElementById('userRole').value;
    
    window.location.href = 'dashboard.html?userId=' + encodeURIComponent(userId) + '&role=' + encodeURIComponent(userRole);
});
    </script>
</body> 
</html> 
