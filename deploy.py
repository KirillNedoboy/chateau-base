import paramiko
import sys
import time

host = '138.124.108.87'
user = 'root'
password = 'AKADeI1yJs16'

print(f"Connecting to {host}...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully!")
    
    commands = [
        "docker exec chateau-base-api-1 npm run db:generate",
        "docker exec chateau-base-api-1 npm run db:migrate",
        "docker exec chateau-base-api-1 npm run db:seed"
    ]
    
    for cmd in commands:
        print(f"\n>>> Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Stream output
        while not stdout.channel.exit_status_ready():
            if stdout.channel.recv_ready():
                chunk = stdout.channel.recv(1024)
                sys.stdout.buffer.write(chunk)
                sys.stdout.buffer.flush()
            time.sleep(0.5)
            
        # Print final output and errors
        out = stdout.read()
        if out:
            sys.stdout.buffer.write(out)
            sys.stdout.buffer.flush()
            
        err = stderr.read()
        if err:
            sys.stdout.buffer.write(b"STDERR:\n")
            sys.stdout.buffer.write(err)
            sys.stdout.buffer.flush()
            
        print(f"EXIT CODE: {stdout.channel.recv_exit_status()}")

    ssh.close()
    print("\nDeployment finished successfully!")
    
except Exception as e:
    print(f"Error during deployment: {e}")
    sys.exit(1)
