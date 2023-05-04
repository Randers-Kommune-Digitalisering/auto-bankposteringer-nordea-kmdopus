I node red er det "Main" der har været fokus på.
"Main" indeholder lige nu kun request-flowet og outputter kun det rå response.

"Datamanipulation" indeholder en msg.payload der er et eksempel på et succesfuldt response fra API'et.
I den fane kan man lege med at lave de funktioner vi har i python-scriptet i dag.
Konteringsreglerne ligger som en særskilt fil i \node-red\konteringsregler.
Der er referet rigtigt til filen i read-file noden.

"Sørens kode crypto" indeholder en masse eksempler på hvordan man kan benytte CryptoJS i node red.
Den er tænkt som inspiration til at fixe signature-krypteringen.

Det burde ikke længere være nødvendigt at besøge Nordeas dev portal for at hente diverse koder/data. Det hele er i node red.
Hvis man når så langt, vil det dog være nødvendigt i requesten at sætte to query-parametre op:
from_date: "2021-11-14"
to_date: "2021-11-14"