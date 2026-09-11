# Run the entire infrastructure via Docker Compose

Write-Host "Starting Frontend Docker Container..."
docker build -t oop_exam_frontend .
docker run -d -p 5173:80 --name oop_exam_frontend_container oop_exam_frontend

Write-Host "Container status:"
docker ps
