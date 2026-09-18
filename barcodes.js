'use strict';

(function () {

  const TEMPLATES = {
    standard: {
      name: 'x2 Label Template'
    },

    small: {
      name: 'x4 Label Template'
    },

    medium: {
      name: 'x8 Label Template'
    },

    large: {
      name: 'x10 Label Template'
    },

    xlarge: {
      name: 'x30 Label Template'
    }
  };

  function init() {

    const CARD =
      document.querySelector(
        '#barcode-drop'
      );

    if (!CARD) {
      setTimeout(init, 100);
      return;
    }

    if (
      document.querySelector(
        '.barcode-dropdown-menu'
      )
    ) {
      return;
    }

    const MENU =
      document.createElement('div');

    MENU.className =
      'barcode-dropdown-menu';

    Object.entries(TEMPLATES)
      .forEach(([id, template]) => {

        const item =
          document.createElement('div');

        item.className =
          'barcode-dropdown-item';

        item.dataset.barcodeTemplate =
          id;

        item.textContent =
          template.name;

        MENU.appendChild(item);

      });

    const divider =
      document.createElement('div');

    divider.className =
      'barcode-dropdown-divider';

    MENU.appendChild(divider);

    const history =
      document.createElement('div');

    history.className =
      'barcode-dropdown-item';

    history.dataset.barcodeHistory =
      '';

    history.textContent =
      'Print History';

    MENU.appendChild(history);

    CARD.parentElement.appendChild(
      MENU
    );

    MENU.style.display =
      'none';

    CARD.addEventListener(
      'click',
      e => {

        e.preventDefault();
        e.stopImmediatePropagation();

        const open =
          MENU.classList.contains(
            'open'
          );

        document
          .querySelectorAll(
            '.barcode-dropdown-menu.open'
          )
          .forEach(menu => {
            menu.classList.remove(
              'open'
            );
          });

        if (!open) {
          MENU.classList.add(
            'open'
          );
        }

      },
      true
    );

    MENU
      .querySelectorAll(
        '[data-barcode-template]'
      )
      .forEach(item => {

        item.addEventListener(
          'click',
          e => {

            e.preventDefault();
            e.stopPropagation();

            MENU.classList.remove(
              'open'
            );

            document.dispatchEvent(
              new CustomEvent(
                'barcode-template-select',
                {
                  detail: {
                    template:
                      item.dataset
                        .barcodeTemplate
                  }
                }
              )
            );

          }
        );

      });

    history.addEventListener(
      'click',
      e => {

        e.preventDefault();
        e.stopPropagation();

        MENU.classList.remove(
          'open'
        );

        document.dispatchEvent(
          new CustomEvent(
            'barcode-history-open'
          )
        );

      }
    );

    document.addEventListener(
      'click',
      e => {

        if (
          !CARD.contains(e.target) &&
          !MENU.contains(e.target)
        ) {
          MENU.classList.remove(
            'open'
          );
        }

      }
    );

  }

  init();

})();
