class Operateur {
    constructor(arite, valeurs) {
        this.Arite = arite;
        this.Valeurs = valeurs;
    }
    Calculer(args) {
        switch (this.Arite) {
            case 0: return this.Valeurs;
            case 1: return this.Valeurs[args[0].Calculer()];
            case 2: return this.Valeurs[args[0].Calculer()][args[1].Calculer()];
        }
    }
}
var V0 = new Operateur(0, 0);
var V1 = new Operateur(0, 1);
var V2 = new Operateur(0, 2);
var V3 = new Operateur(0, 3);
var OperateurNot = new Operateur(1, [1,0,2,3]);
var OperateurEgalStrict = new Operateur(2, [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]);
var OperateurEgalFlou = new Operateur(2, [[1,0,2,3],[0,1,2,3],[2,2,1,0],[3,3,0,1]]);
var OperateurImplique = new Operateur(2, [[1,1,2,3],[0,1,2,3],[2,2,1,0],[3,3,0,1]]);

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
    Calculer() {
        return this.Operateur.Calculer(this.Arguments);
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
        }
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
        $explications.append('Recherche des variables.<br>');
        this.Variables = this.GetVariables();
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');
        this.InitialiserVariables();
        this.Variables[0].Valeur = -1; // Pour passer le premier while
        while(this.IncrementerVariable(0)) {
            $explications.append('Calcul des propositions avec les valuations suivantes : ' + this.Variables.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '<br>');
            for (var ip in this.Propositions) {
                var p = this.Propositions[ip];
                var vp = p.Calculer();
                $explications.append('La proposition ' + ip + ' prend la valeur ' + libellesValeurs[vp] + '<br>');
                if (vp == 1) {
                    this.Solutions.push(this.Variables.map(function(v) {return v.Valeur}));
                }
            }
        }
        $solutions.html('Solutions trouvées : <br>' + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));
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
    'Nathan': ['F', 'T', 'N', 'B'],
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
    var html = $('h3.nomsvaleurs').html();
    for (var i in JeuxLibellesValeurs) {
        html += ' <a href="#" jeuvaleur="' + i + '">' + i + '</a>';
    }
    $('h3.nomsvaleurs').html(html);

    $('a[jeuvaleur]').on('click', function() {
        libellesValeurs = JeuxLibellesValeurs[$(this).attr('jeuvaleur')];
        AfficherLibellesValeurs();
        ResoudreProblemes();
    })

    // Masquer les explications par défaut et les rendre montrables
    $('div.explications').each(function() {
        var $explications = $(this);
        $explications.find('.details').hide();
        $explications.find('h4').css('cursor', 'pointer').on('click', function() {
            $explications.find('.details').toggle();
        });
    });

    // Observer les changements de symboles des opérateurs
    $('table.operateurs input').on('change keypress keyup', function() {
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