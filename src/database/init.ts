import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create projects table
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create project_media table
      db.run(`
        CREATE TABLE IF NOT EXISTS project_media (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('video', 'image', 'doc')),
          url TEXT NOT NULL,
          filename TEXT NOT NULL,
          thumbnail_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
      `);

      // Create project_comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS project_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create project_likes table
      db.run(`
        CREATE TABLE IF NOT EXISTS project_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, user_id),
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Add thumbnail_url column if it doesn't exist (for existing databases)
      db.run(`
        ALTER TABLE project_media ADD COLUMN thumbnail_url TEXT
      `, (err: any) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding thumbnail_url column:', err);
        }
      });

      // Create indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON project_media(project_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON project_comments(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id)');

      db.run('PRAGMA foreign_keys = ON', (err: any) => {
        if (err) {
          reject(err);
        } else {
          // Insert sample data if tables are empty
          db.get('SELECT COUNT(*) as count FROM projects', (err: any, result: any) => {
            if (!err && result.count === 0) {
              // Insert 16 projects total - 8 existing + 8 new "Add New Content" projects
              const sampleProjects = [
                {
                  title: 'AI for Healthcare',
                  description: 'Exploring the use of artificial intelligence in medical diagnostics and patient care.',
                  thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-06-01T10:00:00Z'
                },
                {
                  title: 'Renewable Energy Storage',
                  description: 'Innovative solutions for storing solar and wind energy efficiently.',
                  thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-05-15T14:30:00Z'
                },
                {
                  title: 'Urban Agriculture Revolution',
                  description: 'Transforming city landscapes with vertical farming and sustainable food production systems.',
                  thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-04-20T09:15:00Z'
                },
                {
                  title: 'Ocean Conservation Initiative',
                  description: 'Protecting marine ecosystems through advanced monitoring and restoration technologies.',
                  thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-03-10T16:45:00Z'
                },
                {
                  title: 'Mars Colony Planning',
                  description: 'Comprehensive research and planning for establishing sustainable human settlements on Mars.',
                  thumbnail: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-02-28T11:20:00Z'
                },
                {
                  title: 'Smart City Infrastructure',
                  description: 'Building intelligent urban systems with IoT sensors, autonomous vehicles, and efficient resource management.',
                  thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-02-14T15:45:00Z'
                },
                {
                  title: 'Quantum Computing Breakthrough',
                  description: 'Advancing quantum computing technology for solving complex computational problems in cryptography and drug discovery.',
                  thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-25T13:30:00Z'
                },
                {
                  title: 'Sustainable Transportation Network',
                  description: 'Developing eco-friendly transportation solutions including electric vehicles, hyperloop systems, and smart mobility platforms.',
                  thumbnail: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-10T08:15:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-05T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-04T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-03T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-02T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2024-01-01T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2023-12-31T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2023-12-30T12:00:00Z'
                },
                {
                  title: 'Add New Content',
                  description: 'Click to add your new research project content here.',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
                  created_at: '2023-12-29T12:00:00Z'
                }
              ];

              sampleProjects.forEach((project, index) => {
                db.run('INSERT INTO projects (title, description, thumbnail, created_at) VALUES (?, ?, ?, ?)', 
                  [project.title, project.description, project.thumbnail, project.created_at], 
                  function(this: any, err: any) {
                    if (!err) {
                      const projectId = this.lastID;
                      
                      // Add sample media files for each project
                      const sampleMediaSets = [
                        // AI for Healthcare
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'ai_healthcare_intro.mp4' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'research_paper.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80', filename: 'chart.jpg' }
                        ],
                        // Renewable Energy Storage
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'energy_storage_overview.mp4' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'storage_whitepaper.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=80', filename: 'battery.jpg' }
                        ],
                        // Urban Agriculture Revolution
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'urban_farming_demo.mp4' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'farming_techniques.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80', filename: 'vertical_garden.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=400&q=80', filename: 'greenhouse_tech.jpg' }
                        ],
                        // Ocean Conservation Initiative
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'ocean_restoration.mp4' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'marine_biology_report.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=400&q=80', filename: 'coral_reef.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', filename: 'underwater_monitoring.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'conservation_strategy.pdf' }
                        ],
                        // Mars Colony Planning (3 media items)
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'mars_mission_overview.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=400&q=80', filename: 'mars_surface.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'habitat_design.pdf' }
                        ],
                        // Smart City Infrastructure (6 media items)
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'smart_city_demo.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=400&q=80', filename: 'iot_sensors.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80', filename: 'traffic_management.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'infrastructure_blueprint.pdf' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'implementation_timeline.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1518644730709-0835105d9daa?auto=format&fit=crop&w=400&q=80', filename: 'control_center.jpg' }
                        ],
                        // Gene Therapy Breakthrough (2 media items)
                        [
                          { type: 'image', url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=400&q=80', filename: 'dna_sequence.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'clinical_trials.pdf' }
                        ],
                        // Climate Change Mitigation (5 media items)
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'climate_solutions.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1533222481259-ce20eda4efe4?auto=format&fit=crop&w=400&q=80', filename: 'carbon_capture.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80', filename: 'renewable_grid.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'emission_reduction_plan.pdf' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'global_impact_assessment.pdf' }
                        ],
                        // Virtual Reality Education (4 media items)
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'vr_classroom.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80', filename: 'students_vr.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'learning_outcomes.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=400&q=80', filename: 'virtual_lab.jpg' }
                        ],
                        // Autonomous Robotics (7 media items)
                        [
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'robot_demonstration.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80', filename: 'assembly_robot.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=400&q=80', filename: 'medical_assistant.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'robotics_specifications.pdf' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80', filename: 'rescue_robot.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'ai_algorithms.pdf' },
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'field_testing.mp4' }
                        ],
                        // Cybersecurity Defense (3 media items)
                        [
                          { type: 'image', url: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=400&q=80', filename: 'security_dashboard.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'threat_analysis.pdf' },
                          { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', filename: 'penetration_testing.mp4' }
                        ],
                        // Sustainable Fashion Tech (5 media items)
                        [
                          { type: 'image', url: 'https://images.unsplash.com/photo-1564769625905-50054b3a29f5?auto=format&fit=crop&w=400&q=80', filename: 'bio_textiles.jpg' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80', filename: 'recycled_fabric.jpg' },
                          { type: 'doc', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'sustainability_report.pdf' },
                          { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', filename: 'production_process.mp4' },
                          { type: 'image', url: 'https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=400&q=80', filename: 'fashion_showcase.jpg' }
                        ]
                      ];

                      // Add media files for this project
                      if (sampleMediaSets[index]) {
                        sampleMediaSets[index].forEach(media => {
                          db.run('INSERT INTO project_media (project_id, type, url, filename) VALUES (?, ?, ?, ?)', 
                            [projectId, media.type, media.url, media.filename]);
                        });
                      }
                    }
                  }
                );
              });
            }
          });
          
          // Insert default user for login
          db.get('SELECT COUNT(*) as count FROM users', (err: any, result: any) => {
            if (!err && result.count === 0) {
              const bcrypt = require('bcryptjs');
              const defaultPassword = bcrypt.hashSync('password123', 12);
              
              db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                ['admin', 'admin@example.com', defaultPassword], (err: any) => {
                if (err) {
                  console.log('Error creating default user:', err.message);
                } else {
                  console.log('✅ Default user created: admin@example.com / password123');
                }
              });
            }
          });
          
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
    });
  });
}; 