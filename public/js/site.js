$(function () {
  $('a.delete').on('click', function (e) {
    e.preventDefault()
    let self = $(this)
    $('#confirm').modal('show')
    $('#confirm #delete').off('click').on('click', function (e) {
      e.preventDefault()
      let parent = self.parent()
      console.log(parent)
      if (parent.hasClass('actions')) {
        $('#confirm').modal('hide')
        window.top.location.href = self.attr('href')
      } else {
        $.ajax({
          url: self.attr('href'),
          type: 'DELETE',
          success: function (result) {
            if (result.success) {
              $('#confirm').modal('hide')
              parent.remove()
            }
          }
        })
      }
    })
  })

  $("select[multiple] option").mousedown(function () {
    if ($(this).prop('selected')) {
      $(this).prop("selected", false)
    } else {
      $(this).prop('selected', true)
    }
    return false
  })

  $('.limit select').on('change', function () {
    let model = $(this).attr('id')
    let limit = $(this).val()
    $.ajax({
      url: `/${model}/limit`,
      type: 'POST',
      data: {
        limit: limit
      },
      success: function (result) {
        if (result.success) {
          window.top.location.href = `/${model}`
        }
      }
    })
  })

  $('.header p').off('click').on('click', function (e) {
    e.preventDefault()
    let model = $(this).parent().attr('class').split(' ')[0]
    let field = $(this).attr('id')
    let direction = $(this).attr('class') || 'asc'
    $(this).parent().find('p').removeClass()
    if (direction === 'asc') {
      direction = 'desc'
      $(this).removeClass('asc').addClass('desc')
    } else {
      direction = 'asc'
      $(this).removeClass('desc').addClass('asc')
    }
    console.log(model)
    $.ajax({
      url: `/${model}/sort`,
      type: 'POST',
      data: {
        field: field,
        direction: direction
      },
      success: function (result) {
        if (result.success) {
          window.top.location.href = `/${model}`
        }
      }
    })
  })
})
