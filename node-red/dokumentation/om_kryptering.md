# Hjælp til videre arbejde med kryptering

Til kryptering skal bruges en private key og en public key

Begge dele er gemt som Codespace secrets, som er gemt som miljøvariable i compose-filen.
I workflow har jeg lige nu kun brugt private key, men det betyder at signaturen ikke bliver hashet rigtigt.
Så for at fixe problemet skal disse nodes ændres:

- "Generate crypto key object"
- "Kryptér payload"
Resten burde være ok.

De to function nodes har setup modulet "crypto" imported as "crypto".
I fanen "Sørens kode crypto" er der en masse eksempler på relevant kode der måske kan bruges til at lave den nødvendige ændring.
Derudover må man kigge igennem dokumentationen for CryptoJS.
Jeg tror der skal kigges på classen "sign", som minder om det der bruges i Nordeas egne eksempler.
