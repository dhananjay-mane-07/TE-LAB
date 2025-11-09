/**
 * ========================================================================
 * LAB 7: DATABASE CONNECTIVITY WITH JAVASCRIPT (Node.js)
 * Implement MySQL database connectivity with CRUD operations
 * (Add, Delete, Edit, Display)
 * ========================================================================
 */



const mysql = require('mysql2/promise');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class DatabaseManager {
    constructor(host, database, user, password) {
        this.host = host;
        this.database = database;
        this.user = user;
        this.password = password;
        this.connection = null;
    }

    /**
     * Establish connection to MySQL database
     */
    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: this.host,
                database: this.database,
                user: this.user,
                password: this.password
            });

            console.log('='.repeat(60));
            console.log('✓ Successfully connected to MySQL Server');
            console.log(`✓ Connected to database: ${this.database}`);
            console.log('='.repeat(60));
            console.log();

            // Create table if not exists
            await this.createTable();
            return true;
        } catch (error) {
            console.error(`✗ Error connecting to MySQL: ${error.message}`);
            return false;
        }
    }

    /**
     * Create Employee table if it doesn't exist
     */
    async createTable() {
        try {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS Employee (
                    Emp_ID INT PRIMARY KEY AUTO_INCREMENT,
                    Name VARCHAR(100) NOT NULL,
                    Department VARCHAR(50),
                    Salary DECIMAL(10, 2),
                    Join_Date DATE,
                    Email VARCHAR(100),
                    Phone VARCHAR(15)
                )
            `;
            await this.connection.execute(createTableQuery);
            console.log("✓ Table 'Employee' is ready\n");
        } catch (error) {
            console.error(`✗ Error creating table: ${error.message}`);
        }
    }

    /**
     * Add new employee (CREATE operation)
     */
    async addEmployee() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('ADD NEW EMPLOYEE');
            console.log('='.repeat(60));

            const name = (await question('Enter Name: ')).trim();
            if (!name) {
                console.log('✗ Name cannot be empty!');
                return;
            }

            const department = (await question('Enter Department: ')).trim();
            const salaryInput = (await question('Enter Salary: ')).trim();
            const salary = parseFloat(salaryInput);

            if (isNaN(salary)) {
                console.log('✗ Invalid salary amount!');
                return;
            }

            const joinDate = (await question('Enter Join Date (YYYY-MM-DD): ')).trim();
            
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
                console.log('✗ Invalid date format! Use YYYY-MM-DD');
                return;
            }

            const email = (await question('Enter Email: ')).trim();
            const phone = (await question('Enter Phone: ')).trim();

            const insertQuery = `
                INSERT INTO Employee (Name, Department, Salary, Join_Date, Email, Phone)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await this.connection.execute(insertQuery, 
                [name, department, salary, joinDate, email, phone]);

            console.log('\n' + '='.repeat(60));
            console.log(`✓ Employee '${name}' added successfully!`);
            console.log(`✓ Employee ID: ${result.insertId}`);
            console.log('='.repeat(60));
        } catch (error) {
            console.error(`✗ Error adding employee: ${error.message}`);
        }
    }

    /**
     * Delete employee (DELETE operation)
     */
    async deleteEmployee() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('DELETE EMPLOYEE');
            console.log('='.repeat(60));

            const empId = parseInt(await question('Enter Employee ID to delete: '));

            if (isNaN(empId)) {
                console.log('✗ Invalid Employee ID!');
                return;
            }

            // Check if employee exists
            const [rows] = await this.connection.execute(
                'SELECT Emp_ID, Name, Department FROM Employee WHERE Emp_ID = ?',
                [empId]
            );

            if (rows.length > 0) {
                const employee = rows[0];
                console.log('\nEmployee Details:');
                console.log(`ID: ${employee.Emp_ID}`);
                console.log(`Name: ${employee.Name}`);
                console.log(`Department: ${employee.Department}`);

                const confirm = (await question('\nAre you sure you want to delete this employee? (yes/no): ')).toLowerCase();

                if (confirm === 'yes') {
                    await this.connection.execute('DELETE FROM Employee WHERE Emp_ID = ?', [empId]);
                    
                    console.log('\n' + '='.repeat(60));
                    console.log(`✓ Employee '${employee.Name}' deleted successfully!`);
                    console.log('='.repeat(60));
                } else {
                    console.log('\n✓ Deletion cancelled');
                }
            } else {
                console.log(`\n✗ Employee with ID ${empId} not found`);
            }
        } catch (error) {
            console.error(`✗ Error deleting employee: ${error.message}`);
        }
    }

    /**
     * Edit/Update employee details (UPDATE operation)
     */
    async editEmployee() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('EDIT EMPLOYEE');
            console.log('='.repeat(60));

            const empId = parseInt(await question('Enter Employee ID to edit: '));

            if (isNaN(empId)) {
                console.log('✗ Invalid Employee ID!');
                return;
            }

            // Check if employee exists
            const [rows] = await this.connection.execute(
                'SELECT * FROM Employee WHERE Emp_ID = ?',
                [empId]
            );

            if (rows.length > 0) {
                const employee = rows[0];
                
                console.log('\nCurrent Details:');
                console.log('-'.repeat(60));
                console.log(`ID: ${employee.Emp_ID}`);
                console.log(`Name: ${employee.Name}`);
                console.log(`Department: ${employee.Department}`);
                console.log(`Salary: ${employee.Salary}`);
                console.log(`Join Date: ${employee.Join_Date}`);
                console.log(`Email: ${employee.Email}`);
                console.log(`Phone: ${employee.Phone}`);
                console.log('-'.repeat(60));

                console.log('\nEnter new details (press Enter to keep current value):');

                const name = (await question(`Name [${employee.Name}]: `)).trim() || employee.Name;
                const department = (await question(`Department [${employee.Department}]: `)).trim() || employee.Department;
                
                const salaryInput = (await question(`Salary [${employee.Salary}]: `)).trim();
                const salary = salaryInput ? parseFloat(salaryInput) : employee.Salary;

                const joinDateInput = (await question(`Join Date [${employee.Join_Date}]: `)).trim();
                let joinDate = joinDateInput || employee.Join_Date;

                // Validate date if provided
                if (joinDateInput && !/^\d{4}-\d{2}-\d{2}$/.test(joinDateInput)) {
                    console.log('✗ Invalid date format! Keeping original date');
                    joinDate = employee.Join_Date;
                }

                const email = (await question(`Email [${employee.Email}]: `)).trim() || employee.Email;
                const phone = (await question(`Phone [${employee.Phone}]: `)).trim() || employee.Phone;

                const updateQuery = `
                    UPDATE Employee 
                    SET Name = ?, Department = ?, Salary = ?, 
                        Join_Date = ?, Email = ?, Phone = ?
                    WHERE Emp_ID = ?
                `;
                await this.connection.execute(updateQuery, 
                    [name, department, salary, joinDate, email, phone, empId]);

                console.log('\n' + '='.repeat(60));
                console.log(`✓ Employee ID ${empId} updated successfully!`);
                console.log('='.repeat(60));
            } else {
                console.log(`\n✗ Employee with ID ${empId} not found`);
            }
        } catch (error) {
            console.error(`✗ Error updating employee: ${error.message}`);
        }
    }

    /**
     * Display all employees (READ operation)
     */
    async displayAllEmployees() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('ALL EMPLOYEES');
            console.log('='.repeat(60));

            const [rows] = await this.connection.execute('SELECT * FROM Employee ORDER BY Emp_ID');

            if (rows.length > 0) {
                console.log('\n' + 
                    'ID'.padEnd(5) + 
                    'Name'.padEnd(20) + 
                    'Dept'.padEnd(15) + 
                    'Salary'.padEnd(12) + 
                    'Join Date'.padEnd(12) + 
                    'Email'.padEnd(25) + 
                    'Phone'
                );
                console.log('-'.repeat(120));

                rows.forEach(row => {
                    const id = String(row.Emp_ID).padEnd(5);
                    const name = String(row.Name).substring(0, 19).padEnd(20);
                    const dept = String(row.Department || 'N/A').substring(0, 14).padEnd(15);
                    const salary = (row.Salary && typeof row.Salary === 'number') 
                        ? ('₹' + row.Salary.toFixed(2)).padEnd(12) 
                        : 'N/A'.padEnd(12);
                    const joinDate = String(row.Join_Date ? row.Join_Date.toISOString().split('T')[0] : 'N/A').padEnd(12);
                    const email = String(row.Email || 'N/A').substring(0, 24).padEnd(25);
                    const phone = row.Phone || 'N/A';

                    console.log(id + name + dept + salary + joinDate + email + phone);
                });

                console.log('-'.repeat(120));
                console.log(`\n✓ Total Employees: ${rows.length}`);
                console.log('='.repeat(60));
            } else {
                console.log('\n✗ No employees found in database');
                console.log('='.repeat(60));
            }
        } catch (error) {
            console.error(`✗ Error displaying employees: ${error.message}`);
        }
    }

    /**
     * Search employee by ID, Name, or Department
     */
    async searchEmployee() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('SEARCH EMPLOYEE');
            console.log('='.repeat(60));
            console.log('1. Search by ID');
            console.log('2. Search by Name');
            console.log('3. Search by Department');
            console.log('='.repeat(60));

            const choice = (await question('Enter choice (1-3): ')).trim();
            let query, params;

            if (choice === '1') {
                const empId = parseInt(await question('Enter Employee ID: '));
                query = 'SELECT * FROM Employee WHERE Emp_ID = ?';
                params = [empId];
            } else if (choice === '2') {
                const name = (await question('Enter Name (partial match): ')).trim();
                query = 'SELECT * FROM Employee WHERE Name LIKE ?';
                params = [`%${name}%`];
            } else if (choice === '3') {
                const dept = (await question('Enter Department: ')).trim();
                query = 'SELECT * FROM Employee WHERE Department LIKE ?';
                params = [`%${dept}%`];
            } else {
                console.log('✗ Invalid choice');
                return;
            }

            const [rows] = await this.connection.execute(query, params);

            if (rows.length > 0) {
                console.log('\n' + '='.repeat(60));
                console.log('SEARCH RESULTS');
                console.log('='.repeat(60));
                console.log('\n' + 
                    'ID'.padEnd(5) + 
                    'Name'.padEnd(20) + 
                    'Dept'.padEnd(15) + 
                    'Salary'.padEnd(12) + 
                    'Join Date'
                );
                console.log('-'.repeat(70));

                rows.forEach(row => {
                    const id = String(row.Emp_ID).padEnd(5);
                    const name = String(row.Name).substring(0, 19).padEnd(20);
                    const dept = String(row.Department || 'N/A').substring(0, 14).padEnd(15);
                    const salary = String(row.Salary || 'N/A').padEnd(12);
                    const joinDate = row.Join_Date ? row.Join_Date.toISOString().split('T')[0] : 'N/A';

                    console.log(id + name + dept + salary + joinDate);
                });

                console.log('-'.repeat(70));
                console.log(`\n✓ Found ${rows.length} employee(s)`);
                console.log('='.repeat(60));
            } else {
                console.log('\n✗ No matching employees found');
                console.log('='.repeat(60));
            }
        } catch (error) {
            console.error(`✗ Error searching employee: ${error.message}`);
        }
    }

    /**
     * Display database statistics
     */
    async displayStatistics() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('DATABASE STATISTICS');
            console.log('='.repeat(60));

            // Total employees
            const [totalRows] = await this.connection.execute('SELECT COUNT(*) as total FROM Employee');
            const total = totalRows[0].total;

            // Department-wise count
            const [deptStats] = await this.connection.execute(`
                SELECT Department, COUNT(*) as count, AVG(Salary) as avg_salary
                FROM Employee
                GROUP BY Department
                ORDER BY count DESC
            `);

            // Salary statistics
            const [salaryStats] = await this.connection.execute(`
                SELECT MIN(Salary) as min_sal, MAX(Salary) as max_sal, AVG(Salary) as avg_sal
                FROM Employee
            `);

            console.log(`\nTotal Employees: ${total}`);

            console.log('\nDepartment-wise Distribution:');
            console.log('-'.repeat(60));
            console.log('Department'.padEnd(20) + 'Count'.padEnd(10) + 'Avg Salary');
            console.log('-'.repeat(60));
            
            deptStats.forEach(row => {
                const dept = String(row.Department || 'Unassigned').padEnd(20);
                const count = String(row.count).padEnd(10);
                const avgSal = row.avg_salary ? `₹${row.avg_salary.toFixed(2)}` : 'N/A';
                console.log(dept + count + avgSal);
            });

            console.log('\nSalary Statistics:');
            console.log('-'.repeat(60));
            if (salaryStats[0].min_sal) {
                console.log(`Minimum Salary: ₹${salaryStats[0].min_sal.toFixed(2)}`);
                console.log(`Maximum Salary: ₹${salaryStats[0].max_sal.toFixed(2)}`);
                console.log(`Average Salary: ₹${salaryStats[0].avg_sal.toFixed(2)}`);
            } else {
                console.log('No salary data available');
            }

            console.log('='.repeat(60));
        } catch (error) {
            console.error(`✗ Error fetching statistics: ${error.message}`);
        }
    }

    /**
     * Close database connection
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('\n' + '='.repeat(60));
            console.log('✓ MySQL connection closed');
            console.log('='.repeat(60));
        }
    }
}

/**
 * Display main menu
 */
function displayMenu() {
    console.log('\n' + '='.repeat(60));
    console.log('EMPLOYEE MANAGEMENT SYSTEM - MAIN MENU');
    console.log('='.repeat(60));
    console.log('1. Add Employee');
    console.log('2. Delete Employee');
    console.log('3. Edit Employee');
    console.log('4. Display All Employees');
    console.log('5. Search Employee');
    console.log('6. View Statistics');
    console.log('7. Exit');
    console.log('='.repeat(60));
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('DATABASE CONNECTION SETUP');
    console.log('='.repeat(60));

    // Get database configuration
    const host = (await question('Enter host (default: localhost): ')).trim() || 'localhost';
    const database = (await question('Enter database name (default: library_db): ')).trim() || 'library_db';
    const user = (await question('Enter username (default: root): ')).trim() || 'root';
    const password = await question('Enter password: ');

    // Create database manager instance
    const db = new DatabaseManager(host, database, user, password);

    // Connect to database
    if (!(await db.connect())) {
        console.log('\n✗ Failed to connect to database. Exiting...');
        rl.close();
        process.exit(1);
    }

    // Menu-driven interface
    let running = true;
    while (running) {
        try {
            displayMenu();
            const choice = (await question('\nEnter your choice (1-7): ')).trim();

            switch (choice) {
                case '1':
                    await db.addEmployee();
                    break;
                case '2':
                    await db.deleteEmployee();
                    break;
                case '3':
                    await db.editEmployee();
                    break;
                case '4':
                    await db.displayAllEmployees();
                    break;
                case '5':
                    await db.searchEmployee();
                    break;
                case '6':
                    await db.displayStatistics();
                    break;
                case '7':
                    console.log('\n' + '='.repeat(60));
                    console.log('Thank you for using Employee Management System!');
                    console.log('='.repeat(60));
                    await db.disconnect();
                    running = false;
                    break;
                default:
                    console.log('\n✗ Invalid choice! Please enter a number between 1-7');
            }
        } catch (error) {
            console.error(`\n✗ An error occurred: ${error.message}`);
        }
    }

    rl.close();
}

// Run the application
main().catch(error => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
});

/**
 * ========================================================================
 * INSTALLATION REQUIREMENTS:
 * ========================================================================
 * 
 * 1. Install Node.js (v14 or higher)
 * 2. Install MySQL2 package:
 *    npm install mysql2
 * 
 * ========================================================================
 * HOW TO RUN:
 * ========================================================================
 * 
 * 1. Save this file as: lab7_database.js
 * 2. Install dependencies: npm install mysql2
 * 3. Ensure MySQL Server is running
 * 4. Create database: CREATE DATABASE library_db;
 * 5. Run: node lab7_database.js
 * 6. Enter database credentials when prompted
 * 7. Use menu options to perform operations
 * 
 * ========================================================================
 */