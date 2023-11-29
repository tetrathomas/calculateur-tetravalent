var CalculsDetailles = false;

class Operateur {
    constructor(arite, valeurs, nom) {
        this.Arite = arite;
        this.Valeurs = valeurs;
        this.Nom = nom;
    }
    Calculer(args, $explications) {
        var resultat;
        var valeursArgs = [];
        switch (this.Arite) {
            case 0: resultat = this.Valeurs; break;
            case 1:
                valeursArgs.push(args[0].Calculer($explications));
                resultat = this.Valeurs[valeursArgs[0]];
                break;
            case 2:
                valeursArgs.push(args[0].Calculer($explications));
                valeursArgs.push(args[1].Calculer($explications));
                resultat = this.Valeurs[valeursArgs[0]][valeursArgs[1]];
                break;
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + valeursArgs.join(',') + ' :' + libellesValeurs[resultat] + '<br>');
        return resultat;
    }
    ToString() {
        if (this.Arite == 0) return libellesValeurs[this.Valeurs];
        return this.Nom;
    }
}
var V0 = new Operateur(0, 0);
var V1 = new Operateur(0, 1);
var V2 = new Operateur(0, 2);
var V3 = new Operateur(0, 3);
var OperateurNot = new Operateur(1, [1,0,2,3], 'Not');
var OperateurEgalStrict = new Operateur(2, [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], 'Egal strict');
var OperateurEgalFlou = new Operateur(2, [[1,0,2,3],[0,1,2,3],[2,2,1,0],[3,3,0,1]], 'Egal flou');
var OperateurImplique = new Operateur(2, [[1,1,1,1],[0,1,2,3],[2,1,1,0],[3,1,0,1]], 'Implique');

class Proposition {
    constructor(operateur, args) {
        this.Operateur = operateur;
        this.Arguments = args;
    }
    GetVariables() {
        var variables = [];
        for (var a of this.Arguments) {
            if (a instanceof Variable) variables.push(a);
            if (a instanceof Proposition) variables.push(...a.GetVariables()); // TODO : protection contre la récursion
        }
        return Uniquifier(variables);
    }
    Calculer($explications) {
        return this.Operateur.Calculer(this.Arguments, $explications);
    }
    ToString() {
        var str = this.Operateur.ToString();
        if (this.Arguments.length > 0) {
            str += '(';
            str += this.Arguments.map(function(e) { return e.ToString(); }).join(', ');
            str += ')';
        }
        return str;
    }
}
class Variable {
    constructor(nom) {
        this.Nom = nom;
        this.Valeur = undefined;
    }
    Calculer() {
        return this.Valeur;
    }
    ToString() {
        return this.Nom;
    }
}

class Probleme {

    constructor(idprobleme) {
        this.IdProbleme = idprobleme;
        this.Propositions = [];

        // Données des problèmes prédéfinis (code pas très bien placé pour un principe vite fait mal fait)
        switch (this.IdProbleme) {
            case "1":
                var p = new Variable('P');
                this.Propositions = [new Proposition(OperateurEgalStrict, [p,p])]
                break;
            case "2":
                var p = new Variable('P');
                this.Propositions = [new Proposition(OperateurEgalStrict, [p,
                    new Proposition(OperateurNot, [new Proposition(OperateurNot, [p])])
                ])];
                break;
            case "3":
                var p = new Variable('P');
                this.Propositions = [new Proposition(OperateurEgalFlou, [p, new Proposition(OperateurNot, [p])])];
                break;
            case "4":
                var p1 = new Variable('P1');
                var p2 = new Variable('P2');
                this.Propositions = [new Proposition(OperateurEgalStrict, [p1, p2])];
                break;
            case "5": // P => P
                var p = new Variable('P');
                this.Propositions = [new Proposition(OperateurImplique, [p, p])];
                break;
            case "6": // A => B == !B => !A
                var a = new Variable('A');
                var b = new Variable('B');
                this.Propositions = [new Proposition(OperateurEgalStrict, [
                    new Proposition(OperateurImplique, [a, b]),
                    new Proposition(OperateurImplique, [new Proposition(OperateurNot, [b]), new Proposition(OperateurNot, [a])]),
                ])];
                break;
            case "7": // A = !B ; B = !A
                var a = new Variable('A');
                var b = new Variable('B');
                this.Propositions = [
                    new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
                    new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [a])])
                ];
                break;
            case "8": // A = !B ; B = !C ; C = !A
                var a = new Variable('A');
                var b = new Variable('B');
                var c = new Variable('C');
                this.Propositions = [
                    new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
                    new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [c])]),
                    new Proposition(OperateurEgalFlou, [c, new Proposition(OperateurNot, [a])])
                ];
                break;
            case "9": // P1 == (P2 = 0) ; P2 == (P3 = 0) ; P3 == (P1 = 2)
                var p1 = new Variable('P1');
                var p2 = new Variable('P2');
                var p3 = new Variable('P3');
                this.Propositions = [
                    new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
                    new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p3, V0])]),
                    new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
                ];
                break;
            case "10": // P1 == (P2 = 0) ; P2 == (P1 = 0) ; P3 == (P1 = 2)
                var p1 = new Variable('P1');
                var p2 = new Variable('P2');
                var p3 = new Variable('P3');
                this.Propositions = [
                    new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
                    new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V0])]),
                    new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
                ];
                break;
            case "11": // P1 == (P2 = 0) ; P2 == (P1 = 1)
                var p1 = new Variable('P1');
                var p2 = new Variable('P2');
                this.Propositions = [
                    new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
                    new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])])
                ];
                break;
            case "12": // P1 == (P2 = 0) ; P2 == (P1 = 1) ; P3 == (P1 = 2)
                var p1 = new Variable('P1');
                var p2 = new Variable('P2');
                var p3 = new Variable('P3');
                this.Propositions = [
                    new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
                    new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])]),
                    new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
                ];
                break;
        }
    }

    ToString() {
        return this.Propositions.map(function(p) {return p.ToString()}).join (' ; ');
    }

    GetVariables() {
        var variables = [];
        for (var p of this.Propositions) {
            variables.push(...p.GetVariables());
        }
        return Uniquifier(variables);
    }

    Resoudre($solutions, $explications) {
        this.Solutions = [];
        $explications.html('');
        $explications.append('Début de la résolution du problème.<br>');
        $explications.append('Description du problème : ' + this.ToString() + '.<br>');
        $explications.append('Recherche des variables.<br>');
        this.Variables = this.GetVariables();
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');
        this.InitialiserVariables();
        this.Variables[0].Valeur = -1; // Pour passer le premier while
        while(this.IncrementerVariable(0)) {
            $explications.append('Calcul des propositions avec les valuations suivantes : ' + this.Variables.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '<br>');
            var toutesvraies = true;
            for (var ip in this.Propositions) {
                var p = this.Propositions[ip];
                var vp = p.Calculer($explications);
                $explications.append('La proposition ' + ip + ' prend la valeur ' + libellesValeurs[vp] + '<br>');
                if (vp != 1) toutesvraies = false;
            }
            if (toutesvraies) {
                this.Solutions.push(this.Variables.map(function(v) {return v.Valeur}));
            }
        }
        $solutions.html('Solutions trouvées (' + this.Solutions.length + ') : <br>' + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));
    }
    InitialiserVariables() {
        for (var v of this.Variables) v.Valeur = 0;
    }
    IncrementerVariable(i) {
        var v = this.Variables[i];
        v.Valeur++;
        if (v.Valeur >= 4) {
            if (i >= this.Variables.length-1) return false; // Dernière valeur de la dernière variable
            v.Valeur = 0;
            return this.IncrementerVariable(i+1);
        } else {
            return true;
        }
    }


}

var Uniquifier = function(tableau) {
    return [...new Set(tableau)];
}


var JeuxLibellesValeurs = {
    'Thomas': ['0', '1', 'A', 'T'],
    'Norman': ['F', 'T', 'N', 'B'],
    'Ummo': ['AÏOOYEEDOO', 'AÏOOYAA', 'AÏOOYA AMMIÈ', 'AÏOOYAOU'],
    'Booléen': ['0^!1', '!0^1', '!0^!1', '0^1'],
};

var libellesValeurs = JeuxLibellesValeurs['Thomas'];

var libelleOperateurEgalstrict = '==';
var libelleOperateurEgalflou = '=';
var libelleOperateurNot = '!';
var libelleOperateurImplique = '=>';

var AfficherLibellesValeurs = function() {
    for (var i=0; i<4; i++) {
        $('.definitions .valeurs [name=v' + i + ']').val(libellesValeurs[i]);
        $('.v' + i).html(libellesValeurs[i]);
    }
}

var AfficherLibellesOperateurs = function() {
    $('.definitions .operateurs [name=egalstrict]').val(libelleOperateurEgalstrict);
    $('.definitions .operateurs [name=egalflou]').val(libelleOperateurEgalflou);
    $('.definitions .operateurs [name=not]').val(libelleOperateurNot);
    $('.definitions .operateurs [name=implique]').val(libelleOperateurImplique);
    $('span.egalstrict').html(libelleOperateurEgalstrict);
    $('span.egalflou').html(libelleOperateurEgalflou);
    $('span.not').html(libelleOperateurNot);
    $('span.implique').html(libelleOperateurImplique);
}

var ResoudreProblemes = function() {
    $('div.probleme').each(function() {
        var idprobleme = $(this).find('[idprobleme]').attr('idprobleme');
        var probleme = new Probleme(idprobleme);
        probleme.Resoudre($(this).find('p.solutions'), $(this).find('.explications .details'));
    });
}

$(document).ready(function() {

    // Remplir les select de valeurs
    $('select.valeurs').each(function() {
        for (var i=0; i<4; i++)
            $(this).append('<option value="' + i + '" class="v' + i + '">' + + '</option>');
        $(this).val($(this).attr('defaut'));
    });

    AfficherLibellesValeurs();
    AfficherLibellesOperateurs();

    // Afficher les jeux de libellés de valeurs
    var html = $('.jeuxnomsvaleurs').html();
    for (var i in JeuxLibellesValeurs) {
        html += '<br><a href="#" jeuvaleur="' + i + '">' + i + '</a>';
    }
    $('.jeuxnomsvaleurs').html(html);

    $('a[jeuvaleur]').on('click', function() {
        libellesValeurs = JeuxLibellesValeurs[$(this).attr('jeuvaleur')];
        AfficherLibellesValeurs();
        ResoudreProblemes();
    })

    $('input[name=details]').on('change', function() {
        CalculsDetailles = $(this).is(':checked');
        ResoudreProblemes();
    });

    // Masquer les explications par défaut et les rendre montrables
    $('div.explications').each(function() {
        var $explications = $(this);
        $explications.find('.details').hide();
        $explications.find('h4').css('cursor', 'pointer').on('click', function() {
            $explications.find('.details').toggle();
        });
    });

    // Permettre de déplier les paramètres des opérateurs
    $('div.operateur').each(function() {
        var $operateur = $(this);
        $operateur.find('h4').append('<span class="toggler"> &#9658;</span>').css('cursor', 'pointer').on('click', function() {
            $depliable = $operateur.find('.depliable');
            $operateur.find('.toggler').remove();
            if ($depliable.is(':visible')) {
                $depliable.hide();
                $operateur.find('h4').append('<span class="toggler"> &#9658;</span>')
            } else {
                $depliable.show();
                $operateur.find('h4').append('<span class="toggler"> &#9660;</span>')
            }
        });
    });

    // Observer les changements de symbole des opérateurs
    $('input.symboleoperateur').on('change keypress keyup', function() {
        switch ($(this).attr('name')) {
            case 'egalstrict': libelleOperateurEgalstrict = $(this).val(); break;
            case 'egalflou': libelleOperateurEgalflou = $(this).val(); break;
            case 'not': libelleOperateurNot = $(this).val(); break;
            case 'implique': libelleOperateurImplique = $(this).val(); break;
        }
        AfficherLibellesOperateurs();
    })

    // Observer les changements de définition des opérateurs
    $('div.definitions select').on('change', function() {
        var name = $(this).attr('name').split('-');
        var nomOperateur = name.shift(); // Premier élément
        var operateur = null;
        var args = name; // Autres éléments
        switch (nomOperateur) {
            case 'not': operateur = OperateurNot; break;
            case 'egalstrict': operateur = OperateurEgalStrict; break;
            case 'egalflou': operateur = OperateurEgalFlou; break;
            case 'implique': operateur = OperateurImplique; break;
        }
        switch (operateur.Arite) {
            case 1:
                operateur.Valeurs[parseInt(args[0][1], 10)] = parseInt($(this).val(), 10);
                break;
            case 2:
                operateur.Valeurs[parseInt(args[0][1], 10)][parseInt(args[1][1], 10)] = parseInt($(this).val(), 10);
                break;
        }
        ResoudreProblemes();
    });

    ResoudreProblemes();

});