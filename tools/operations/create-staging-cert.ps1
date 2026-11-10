param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$taskKeyFile=Join-Path $OutputDirectory 'localhost-key.pem'
$taskCertFile=Join-Path $OutputDirectory 'localhost-cert.pem'
if ((Test-Path -LiteralPath $taskKeyFile) -or (Test-Path -LiteralPath $taskCertFile)) { throw 'STAGING_TLS_ALREADY_EXISTS' }
$taskRsa=[Security.Cryptography.RSA]::Create(3072)
try {
  $taskRequest=[Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=FinWeave local synthetic localhost',$taskRsa,[Security.Cryptography.HashAlgorithmName]::SHA256,[Security.Cryptography.RSASignaturePadding]::Pkcs1)
  $taskSan=[Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
  $taskSan.AddDnsName('localhost');$taskSan.AddIpAddress([Net.IPAddress]::Parse('127.0.0.1'))
  $taskRequest.CertificateExtensions.Add($taskSan.Build())
  $taskRequest.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false,$false,0,$true))
  $taskRequest.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new([Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature,$true))
  $taskCertificate=$taskRequest.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-5),[DateTimeOffset]::UtcNow.AddDays(30))
  [IO.File]::WriteAllText($taskKeyFile,$taskRsa.ExportPkcs8PrivateKeyPem())
  [IO.File]::WriteAllText($taskCertFile,$taskCertificate.ExportCertificatePem())
  Write-Output 'Local synthetic TLS certificate created; no system trust store modified.'
} finally {$taskRsa.Dispose()}
