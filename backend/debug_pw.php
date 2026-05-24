<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$u = App\Models\User::where('email', 'admin@jobassign.com')->first();
$raw = $u->getRawOriginal('password');

echo "Stored hash length: " . strlen($raw) . PHP_EOL;
echo "Stored hash: " . $raw . PHP_EOL;
echo "Match 'password': " . (password_verify('password', $raw) ? 'YES' : 'NO') . PHP_EOL;

$fresh = password_hash('password', PASSWORD_BCRYPT);
echo "Fresh hash: " . $fresh . PHP_EOL;
echo "Fresh match: " . (password_verify('password', $fresh) ? 'YES' : 'NO') . PHP_EOL;
